-- REAL ジムスケジューラー: Supabase スキーマ
-- Supabase の SQL Editor でこのファイルの内容を実行してください。
-- 既存のプロジェクトを members テーブル対応に更新する場合は
-- supabase/migrate_add_members_table.sql を実行してください。

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null,
  created_at timestamptz not null default now()
);

alter table public.members enable row level security;

create policy "anon can read members" on public.members
  for select to anon using (true);

create policy "anon can insert members" on public.members
  for insert to anon with check (true);

insert into public.members (name, color) values
  ('佐藤', '#4C6EF5'),
  ('ジョンス', '#F76707'),
  ('手島', '#2F9E44'),
  ('飯田', '#E64980'),
  ('正義', '#9C36B5')
on conflict (name) do nothing;

create table if not exists public.slots (
  id uuid primary key default gen_random_uuid(),
  member text not null references public.members (name) on update cascade,
  slot_date date not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  constraint end_after_start check (end_time > start_time),
  constraint closed_on_tuesday check (extract(dow from slot_date) <> 2),
  constraint within_business_hours check (
    (
      extract(dow from slot_date) = 0
      and start_time >= time '12:00'
      and end_time <= time '19:30'
    )
    or (
      extract(dow from slot_date) not in (0, 2)
      and start_time >= time '12:00'
      and end_time <= time '23:00'
    )
  ),
  constraint one_slot_per_member_per_day unique (member, slot_date)
);

create index if not exists slots_slot_date_idx on public.slots (slot_date);

alter table public.slots enable row level security;

-- 身内だけで使うアプリのため、ログインなしで匿名キーからの
-- 読み書きを許可する。外部公開する場合はここにメンバー認証を追加すること。
create policy "anon can read slots" on public.slots
  for select to anon using (true);

create policy "anon can insert slots" on public.slots
  for insert to anon with check (true);

create policy "anon can update slots" on public.slots
  for update to anon using (true) with check (true);

create policy "anon can delete slots" on public.slots
  for delete to anon using (true);
