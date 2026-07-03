-- ブロックリスト (spec section 3.6). Missing from the section 4 schema
-- listing, same gap as interest_tags — added here since the mypage screen
-- has nowhere else to persist it.

create table blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references users (id) on delete cascade,
  blocked_id uuid not null references users (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (blocker_id <> blocked_id),
  unique (blocker_id, blocked_id)
);

alter table blocks enable row level security;

create policy "users can read own blocks" on blocks
  for select using (auth.uid() = blocker_id);

create policy "users can create own blocks" on blocks
  for insert with check (auth.uid() = blocker_id);

create policy "users can remove own blocks" on blocks
  for delete using (auth.uid() = blocker_id);

-- Restrictive policies AND with the existing permissive ones (spec 3.6:
-- blocking must actually prevent contact, not just hide a list entry).

create policy "blocked pairs cannot see each other's checkins" on checkins
  as restrictive for select using (
    not exists (
      select 1 from blocks
      where (blocker_id = auth.uid() and blocked_id = checkins.user_id)
         or (blocked_id = auth.uid() and blocker_id = checkins.user_id)
    )
  );

-- Note: these use checkin_owner() (defined in 0001), not a plain subquery
-- into checkins, precisely because that subquery would itself be subject
-- to the restrictive select policy just above — once two users block each
-- other, the plain form would silently see zero rows and this check would
-- fail *open* instead of closed. See the comment on checkin_owner().
create policy "blocked pairs cannot send join requests" on join_requests
  as restrictive for insert with check (
    not exists (
      select 1 from blocks
      where (blocker_id = auth.uid() and blocked_id = checkin_owner(join_requests.checkin_id))
         or (blocked_id = auth.uid() and blocker_id = checkin_owner(join_requests.checkin_id))
    )
  );

create policy "blocked pairs cannot message each other" on messages
  as restrictive for insert with check (
    not exists (
      select 1 from blocks b
      join join_requests jr on jr.id = messages.join_request_id
      where (
        b.blocker_id = auth.uid()
        and b.blocked_id = case when auth.uid() = jr.requester_id then checkin_owner(jr.checkin_id) else jr.requester_id end
      ) or (
        b.blocked_id = auth.uid()
        and b.blocker_id = case when auth.uid() = jr.requester_id then checkin_owner(jr.checkin_id) else jr.requester_id end
      )
    )
  );
