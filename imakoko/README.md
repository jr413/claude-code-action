# イマココ (MVP)

ローカル飲食店チェックイン型交流SNS。仕様書は開発時のセッション履歴を参照(Next.js 14+ App Router / TypeScript / Tailwind / Supabase)。

## Setup

1. Supabase プロジェクトを作成
2. `supabase/migrations/0001_init.sql`, `0002_checkin_expiry.sql` を順に実行(スキーマ + RLS + 失効cron + Realtime)
3. `supabase/seed.sql` を実行(初期エリア: 小牧)
4. `.env.local.example` を `.env.local` にコピーし、Supabase の URL / anon key / service role key と管理画面用の `ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET` を設定
5. `bun install && bun dev`

## 実装状況

### Sprint 1(基盤)

- [x] プロジェクトセットアップ / DBスキーマ・RLS
- [x] SMS認証(Supabase Auth 電話番号OTP)
- [x] プロフィール登録・KYC画像アップロード
- [x] 管理画面: KYC承認キュー(`/admin/kyc`、`ADMIN_PASSWORD` によるゲート)

### Sprint 2(コア体験)

- [x] チェックイン投稿(3時間失効、`pg_cron`でのクローズ処理)
- [x] エリアフィード(Supabase Realtimeでライブ更新)
- [x] 店舗ページ(いる人/向かってる人リスト・提携バッジ・クーポン)
- [x] 管理画面: 店舗マスタ管理(`/admin/shops`)

「合流したい」ボタンはリクエスト送信(pending作成)まで実装済み。承認・1:1トーク・24h書き込み制限はSprint 3で対応。
Google Places連携による未登録店舗申請、エリアタブ切替、「今夜のマップ」ビューは未実装(店舗検索はDB登録済み店舗のみ)。

### 未実装(Sprint 3以降)

合流リクエスト承認・1:1トーク、通報・ブロック・NGワード検知、合流記念のX共有、Stripe課金、PWA化・Web Push、KPIダッシュボード。
