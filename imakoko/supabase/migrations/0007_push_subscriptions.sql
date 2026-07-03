-- Web Push subscription storage (spec section 4 mentions notifications;
-- section 6 Sprint 4: "PWA化(Web Push通知)"). This captures subscriptions
-- only — actually sending push (e.g. the weekly "今夜空いてます" campaign
-- for standard-plan shops, spec 5.2) needs a scheduled job wired to VAPID
-- keys, which is future work once those credentials exist.

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

create policy "users can manage own push subscriptions" on push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
