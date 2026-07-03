-- Initial area for MVP launch (spec section 3.2 / 7: single-area launch).
insert into areas (name, is_active) values ('小牧', true)
on conflict do nothing;
