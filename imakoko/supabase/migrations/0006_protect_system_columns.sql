-- Fixes a live bug in 0001's "users can update own profile" policy: its
-- with check required kyc_status = 'pending' on the *new* row, which is
-- never true once a user is verified — so verified users (i.e. everyone
-- who can use the app at all) could never update their own profile again,
-- not even their nickname.
--
-- The actual intent was narrower: users can edit their own profile freely,
-- but must never be able to change the columns that other parts of the
-- system treat as authoritative (kyc_status/is_banned/strike_count via
-- admin review, plan/stripe_customer_id via the Stripe webhook). RLS
-- WITH CHECK can't cleanly express "this column must equal its previous
-- value" for UPDATE, so a trigger pins them back to OLD instead — service
-- role (bypassrls) is exempt so admin/webhook writes still work.

drop policy "users can update own profile" on users;

create policy "users can update own profile" on users
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function pin_system_managed_user_columns()
returns trigger
language plpgsql
as $$
begin
  if (select rolbypassrls from pg_roles where rolname = current_user) then
    return new;
  end if;

  new.kyc_status := old.kyc_status;
  new.kyc_image_url := old.kyc_image_url;
  new.is_banned := old.is_banned;
  new.strike_count := old.strike_count;
  new.plan := old.plan;
  new.stripe_customer_id := old.stripe_customer_id;
  return new;
end;
$$;

create trigger users_pin_system_managed_columns
  before update on users
  for each row execute function pin_system_managed_user_columns();

-- Needed for the Stripe webhook's upsert-by-subscription-id (section 5.1).
alter table subscriptions add constraint subscriptions_stripe_subscription_id_key
  unique (stripe_subscription_id);
