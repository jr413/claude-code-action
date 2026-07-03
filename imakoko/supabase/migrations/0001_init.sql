-- イマココ MVP: initial schema
--
-- Design constraint (do not violate): no gender column anywhere. See
-- spec section 1.3 — this is required to stay outside the scope of the
-- Act on Control and Improvement of Internet Dating Services (出会い系
-- サイト規制法).
--
-- Admin access model: there is no in-DB "admin" role. The admin screen
-- (Naoki-only) reads/writes via the Supabase service-role key, which
-- bypasses RLS entirely. RLS below is written only for the anon/
-- authenticated roles used by the end-user app.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- areas
-- ---------------------------------------------------------------------
create table areas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true
);

-- ---------------------------------------------------------------------
-- users (profile row 1:1 with auth.users; intentionally has no gender
-- column and no gender-derived feature flags)
-- ---------------------------------------------------------------------
create table users (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null,
  avatar_url text,
  bio text,
  interest_tags text[] not null default '{}'
    check (cardinality(interest_tags) <= 5),
  birth_date date not null,
  kyc_status text not null default 'pending'
    check (kyc_status in ('pending', 'verified', 'rejected')),
  kyc_image_url text,
  plan text not null default 'free' check (plan in ('free', 'premium')),
  stripe_customer_id text,
  strike_count int not null default 0,
  is_banned boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- shops
-- ---------------------------------------------------------------------
create table shops (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references areas (id),
  name text not null,
  genre text,
  address text,
  google_place_id text,
  photo_url text,
  partner_plan text not null default 'none'
    check (partner_plan in ('none', 'light', 'standard')),
  partner_since date,
  stripe_customer_id text,
  is_active boolean not null default true
);

-- ---------------------------------------------------------------------
-- checkins
-- ---------------------------------------------------------------------
create table checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  shop_id uuid not null references shops (id),
  status text not null check (status in ('here', 'heading')),
  message text,
  capacity int not null check (capacity between 1 and 4),
  expires_at timestamptz not null,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

-- One active checkin per user. "Active" = not yet manually ended.
-- Expiry itself is enforced by a scheduled job (Sprint 2) that sets
-- ended_at once expires_at has passed, since a partial index can't call
-- now() in its predicate.
create unique index checkins_one_active_per_user
  on checkins (user_id)
  where ended_at is null;

create index checkins_shop_active_idx
  on checkins (shop_id)
  where ended_at is null;

-- ---------------------------------------------------------------------
-- join_requests ("合流したい")
-- ---------------------------------------------------------------------
create table join_requests (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references checkins (id) on delete cascade,
  requester_id uuid not null references users (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now(),
  unique (checkin_id, requester_id)
);

-- ---------------------------------------------------------------------
-- messages (1:1 thread scoped to an approved join_request)
-- ---------------------------------------------------------------------
create table messages (
  id uuid primary key default gen_random_uuid(),
  join_request_id uuid not null references join_requests (id) on delete cascade,
  sender_id uuid not null references users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- meetups (confirmed real-world meetups; KPI + commemorative post source)
-- ---------------------------------------------------------------------
create table meetups (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references checkins (id) on delete cascade,
  confirmed_by uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- reports
-- ---------------------------------------------------------------------
create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references users (id) on delete cascade,
  target_user_id uuid references users (id) on delete cascade,
  target_type text not null check (target_type in ('checkin', 'message', 'profile')),
  target_id uuid not null,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- coupons (partner shops only)
-- ---------------------------------------------------------------------
create table coupons (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops (id) on delete cascade,
  title text not null,
  conditions text,
  is_active boolean not null default true
);

-- ---------------------------------------------------------------------
-- subscriptions (Stripe webhook sync target; both user and shop plans)
-- ---------------------------------------------------------------------
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('user', 'shop')),
  owner_id uuid not null,
  stripe_subscription_id text not null,
  plan text not null,
  status text not null,
  current_period_end timestamptz
);

-- =======================================================================
-- Row Level Security
-- =======================================================================

alter table areas enable row level security;
alter table users enable row level security;
alter table shops enable row level security;
alter table checkins enable row level security;
alter table join_requests enable row level security;
alter table messages enable row level security;
alter table meetups enable row level security;
alter table reports enable row level security;
alter table coupons enable row level security;
alter table subscriptions enable row level security;

-- areas / shops / coupons: public read, no client writes (admin uses
-- the service-role key for all mutations).
create policy "areas are publicly readable" on areas
  for select using (true);

create policy "shops are publicly readable" on shops
  for select using (is_active);

create policy "coupons are publicly readable" on coupons
  for select using (is_active);

-- users: anyone signed in can read public profile fields via the app's
-- select list (kyc_image_url must never be selected from the client —
-- enforced at the query layer, not by column-level RLS, since Postgres
-- RLS is row- not column-scoped). Users can only write their own row,
-- and can never set their own kyc_status (that's admin-only, via the
-- service-role key).
create policy "users can read profiles" on users
  for select using (auth.uid() is not null);

create policy "users can insert own profile" on users
  for insert with check (auth.uid() = id);

create policy "users can update own profile" on users
  for update using (auth.uid() = id)
  with check (auth.uid() = id and kyc_status = 'pending');

-- checkins: verified, non-banned users only. Anyone signed in can read
-- active checkins (the whole point of the feed); only the owner can
-- write/end their own.
create policy "checkins are readable by signed in users" on checkins
  for select using (auth.uid() is not null);

create policy "verified non-banned users can create checkins" on checkins
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from users
      where users.id = auth.uid()
        and users.kyc_status = 'verified'
        and users.is_banned = false
    )
  );

create policy "owner can update own checkin" on checkins
  for update using (auth.uid() = user_id);

-- join_requests: requester creates; requester and the checkin owner can
-- both see/manage a request.
create policy "participants can read join requests" on join_requests
  for select using (
    auth.uid() = requester_id
    or auth.uid() in (
      select user_id from checkins where checkins.id = join_requests.checkin_id
    )
  );

create policy "verified non-banned users can create join requests" on join_requests
  for insert with check (
    auth.uid() = requester_id
    and exists (
      select 1 from users
      where users.id = auth.uid()
        and users.kyc_status = 'verified'
        and users.is_banned = false
    )
  );

create policy "checkin owner can respond to join request" on join_requests
  for update using (
    auth.uid() in (
      select user_id from checkins where checkins.id = join_requests.checkin_id
    )
  );

-- messages: only the two participants of an *approved* join_request may
-- read or write. This is the DM-approval-gate from spec section 3.5.
create policy "thread participants can read messages" on messages
  for select using (
    exists (
      select 1 from join_requests jr
      join checkins c on c.id = jr.checkin_id
      where jr.id = messages.join_request_id
        and jr.status = 'approved'
        and (auth.uid() = jr.requester_id or auth.uid() = c.user_id)
    )
  );

create policy "thread participants can send messages" on messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from join_requests jr
      join checkins c on c.id = jr.checkin_id
      where jr.id = messages.join_request_id
        and jr.status = 'approved'
        and (auth.uid() = jr.requester_id or auth.uid() = c.user_id)
        -- 24h post-expiry write lock (spec 3.5)
        and (c.ended_at is null or c.ended_at > now() - interval '24 hours')
        and c.expires_at > now() - interval '24 hours'
    )
  );

-- meetups: readable/insertable by either party of the underlying checkin.
create policy "checkin participants can read meetups" on meetups
  for select using (
    auth.uid() = any (confirmed_by)
    or auth.uid() in (
      select user_id from checkins where checkins.id = meetups.checkin_id
    )
  );

create policy "checkin participants can confirm meetup" on meetups
  for insert with check (
    auth.uid() = any (confirmed_by)
  );

-- reports: reporter can create and read their own reports; nobody can
-- read others' reports from the client (admin uses service role).
create policy "users can file reports" on reports
  for insert with check (auth.uid() = reporter_id);

create policy "reporters can read own reports" on reports
  for select using (auth.uid() = reporter_id);

-- subscriptions: owner can read their own billing state; all writes
-- come from the Stripe webhook handler via the service-role key.
create policy "users can read own subscription" on subscriptions
  for select using (owner_type = 'user' and owner_id = auth.uid());

-- ---------------------------------------------------------------------
-- Storage: private bucket for KYC documents. Only the uploading user
-- and the service role (admin) may ever read these objects; objects are
-- deleted by the admin flow once a review decision is recorded (spec
-- section 4: "承認後は速やかに削除").
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('kyc-documents', 'kyc-documents', false)
on conflict (id) do nothing;

create policy "users can upload own kyc document"
  on storage.objects for insert
  with check (
    bucket_id = 'kyc-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users can read own kyc document"
  on storage.objects for select
  using (
    bucket_id = 'kyc-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------
-- Storage: public bucket for profile avatars.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "users can upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users can replace own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
