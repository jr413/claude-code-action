# イマココ (MVP)

ローカル飲食店チェックイン型交流SNS。仕様書は開発時のセッション履歴を参照(Next.js 14+ App Router / TypeScript / Tailwind / Supabase)。

## Setup

1. Supabase プロジェクトを作成
2. `supabase/migrations/` を番号順に実行(スキーマ + RLS + 失効cron + Realtime + ブロック + NGワード検知 + 合流確認)
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

Google Places連携による未登録店舗申請、エリアタブ切替、「今夜のマップ」ビューは未実装(店舗検索はDB登録済み店舗のみ)。

### Sprint 3(合流とメッセージ・安全機能)

- [x] 合流リクエスト受信一覧・承認/辞退(`/requests`)
- [x] 1:1トーク(`/messages/[id]`、承認済みリクエストのみ、24時間書き込み制限はRLSで強制)
- [x] 通報ボタン(チェックイン・プロフィール対象、`/report/new`)・ブロック機能(`blocks`テーブル、RLSでチェックイン閲覧/リクエスト/メッセージを相互遮断)
- [x] NGワード自動検知(トリガーで`checkins.message`/`messages.body`を監視、該当チェックインは即時非表示、通報キューへ自動フラグ)
- [x] 管理画面: 通報対応キュー(`/admin/reports`、投稿非表示/警告(2回でBAN)/BAN)
- [x] 合流記念のX共有(双方確認後にXへの投稿リンクを表示、店舗名のみ・個人名は含めない)

`interest_tags`(3.1)・`blocks`(3.6)は仕様書section 4のDB設計に列/テーブルが無かったため、画面要件を満たすために追加。

### 未実装

Google Places連携(未登録店舗申請)、エリアタブ切替・「今夜のマップ」ビュー、Stripe課金(ユーザーPremium/店舗プラン)、PWA化・Web Push通知、KPIダッシュボード、イベント機能(Phase 3)。
