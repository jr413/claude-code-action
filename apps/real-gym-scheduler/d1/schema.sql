-- REAL ジムスケジューラー: Cloudflare D1 スキーマ
-- Cloudflareダッシュボードの D1 → 対象データベース → Console で実行するか、
-- npx wrangler d1 execute <データベース名> --remote --file=d1/schema.sql で実行してください。

create table if not exists members (
  id text primary key,
  name text not null unique,
  color text not null,
  created_at text not null default (datetime('now'))
);

create table if not exists slots (
  id text primary key,
  member text not null references members (name) on update cascade,
  slot_date text not null,
  start_time text not null,
  end_time text not null,
  created_at text not null default (datetime('now')),
  unique (member, slot_date)
);

create index if not exists slots_slot_date_idx on slots (slot_date);

insert into members (id, name, color) values
  (lower(hex(randomblob(16))), '佐藤', '#4C6EF5'),
  (lower(hex(randomblob(16))), 'ジョンス', '#F76707'),
  (lower(hex(randomblob(16))), '手島', '#2F9E44'),
  (lower(hex(randomblob(16))), '飯田', '#E64980'),
  (lower(hex(randomblob(16))), '正義', '#9C36B5')
on conflict (name) do nothing;
