-- Fills in gaps in the meetups RLS from 0001: the original policies only
-- covered insert and let a confirmed participant read their own row. A
-- participant needs to read the row *before* they've confirmed too (to see
-- their counterpart already has), and someone confirming second needs an
-- update policy to append to confirmed_by rather than insert.

alter table meetups add constraint meetups_checkin_id_unique unique (checkin_id);

create policy "approved participants can read meetups" on meetups
  for select using (
    auth.uid() = checkin_owner(meetups.checkin_id)
    or auth.uid() in (
      select requester_id from join_requests
      where join_requests.checkin_id = meetups.checkin_id and join_requests.status = 'approved'
    )
  );

create policy "approved participants can update meetup confirmation" on meetups
  for update using (
    auth.uid() = checkin_owner(meetups.checkin_id)
    or auth.uid() in (
      select requester_id from join_requests
      where join_requests.checkin_id = meetups.checkin_id and join_requests.status = 'approved'
    )
  )
  with check (auth.uid() = any(confirmed_by));
