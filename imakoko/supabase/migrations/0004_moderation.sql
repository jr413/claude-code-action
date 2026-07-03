-- NGワード検知 (spec section 4 / 6, Sprint 3): flags matching checkins and
-- messages into the existing `reports` queue automatically, and hides the
-- checkin immediately ("出会い目的投稿は即時非表示"). Escalation to a
-- warning/strike or a ban stays a human decision made from the admin
-- report queue (section 3.7) rather than fully automated.

create or replace function flag_ngword_matches()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ng_words text[] := array[
    'ホテル', '援交', '援助交際', 'パパ活', 'ママ活', '出会い',
    '円で会える', 'ライン交換希望', 'p活', 's対応'
  ];
  content text;
  poster_id uuid;
  matched_word text;
begin
  if TG_TABLE_NAME = 'checkins' then
    content := new.message;
    poster_id := new.user_id;
  else
    content := new.body;
    poster_id := new.sender_id;
  end if;

  if content is null then
    return new;
  end if;

  foreach matched_word in array ng_words loop
    if content ilike '%' || matched_word || '%' then
      insert into reports (reporter_id, target_user_id, target_type, target_id, reason)
      values (
        poster_id,
        poster_id,
        case TG_TABLE_NAME when 'checkins' then 'checkin' else 'message' end,
        new.id,
        'NGワード自動検知: ' || matched_word
      );

      if TG_TABLE_NAME = 'checkins' then
        new.ended_at := now();
      end if;

      exit;
    end if;
  end loop;

  return new;
end;
$$;

create trigger checkins_ngword_flag
  before insert on checkins
  for each row execute function flag_ngword_matches();

create trigger messages_ngword_flag
  after insert on messages
  for each row execute function flag_ngword_matches();

-- Banned users lose write access everywhere, including threads that were
-- already approved before the ban.
create policy "banned users cannot send messages" on messages
  as restrictive for insert with check (
    not exists (
      select 1 from users where users.id = auth.uid() and users.is_banned
    )
  );
