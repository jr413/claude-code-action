# イマココ (MVP)

ローカル飲食店チェックイン型交流SNS。仕様書は開発時のセッション履歴を参照(Next.js 14+ App Router / TypeScript / Tailwind / Supabase)。

## Setup

1. Supabase プロジェクトを作成
2. `supabase/migrations/0001_init.sql` を実行(スキーマ + RLS)
3. `supabase/seed.sql` を実行(初期エリア: 小牧)
4. `.env.local.example` を `.env.local` にコピーし、Supabase の URL / anon key / service role key と管理画面用の `ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET` を設定
5. `bun install && bun dev`

## 実装状況(Sprint 1)

- [x] プロジェクトセットアップ / DBスキーマ・RLS
- [x] SMS認証(Supabase Auth 電話番号OTP)
- [x] プロフィール登録・KYC画像アップロード
- [x] 管理画面: KYC承認キュー(`/admin/kyc`、`ADMIN_PASSWORD` によるゲート)

Sprint 2以降(チェックイン投稿・エリアフィード・店舗ページなど)は未実装。
