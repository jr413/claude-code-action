-- 既存の Supabase プロジェクトを「アプリからメンバーを追加できる」構成に更新するマイグレーション。
-- Supabase の SQL Editor で一度だけ実行してください。

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

-- これまでの固定メンバーを members テーブルに登録する
insert into public.members (name, color) values
  ('佐藤', '#4C6EF5'),
  ('ジョンス', '#F76707'),
  ('手島', '#2F9E44'),
  ('飯田', '#E64980'),
  ('正義', '#9C36B5')
on conflict (name) do nothing;

-- slots.member の固定リストチェックをやめ、members テーブルへの参照に切り替える
alter table public.slots drop constraint if exists slots_member_check;
alter table public.slots
  add constraint slots_member_fkey foreign key (member)
  references public.members (name) on update cascade;
