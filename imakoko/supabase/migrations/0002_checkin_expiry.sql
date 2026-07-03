-- Closes checkins whose expires_at has passed. Runs on a schedule via
-- pg_cron (spec section 6, Sprint 2: "expires_atとcronでのクローズ処理").
-- Until this runs, the app layer also filters `expires_at > now()` when
-- reading the "active" feed, so expiry is never visibly late even though
-- ended_at is set asynchronously.

-- pg_cron is non-relocatable (its control file pins schema = pg_catalog),
-- so it cannot be installed into `extensions` like most other extensions.
create extension if not exists pg_cron;

create or replace function close_expired_checkins()
returns void
language sql
security definer
set search_path = public
as $$
  update checkins
  set ended_at = expires_at
  where ended_at is null
    and expires_at <= now();
$$;

select cron.schedule(
  'close-expired-checkins',
  '*/5 * * * *',
  $$select close_expired_checkins()$$
)
where not exists (
  select 1 from cron.job where jobname = 'close-expired-checkins'
);

-- Area feed live updates (spec section 6, Sprint 2).
alter publication supabase_realtime add table checkins;
