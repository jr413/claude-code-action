# イマココ (MVP)

ローカル飲食店チェックイン型交流SNS。仕様書は開発時のセッション履歴を参照(Next.js 14+ App Router / TypeScript / Tailwind / Supabase)。

## Setup

1. Supabase プロジェクトを作成
2. `supabase/migrations/` を番号順に実行(スキーマ + RLS + 失効cron + Realtime + ブロック + NGワード検知 + 合流確認 + システム管理列の保護 + Push購読)
3. `supabase/seed.sql` を実行(初期エリア: 小牧)
4. `.env.local.example` を `.env.local` にコピーし、Supabase の URL / anon key / service role key、管理画面用の `ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET`、Stripeの `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PREMIUM_PRICE_ID` を設定
5. `bun install && bun dev`

すべてのマイグレーションはローカルPostgres(pg_cron拡張込み)+Supabaseのauth/storageスキーマを再現したシムに対して実行確認済み(Docker Hubへのアクセスがブロックされた環境のため、Supabase CLIのDocker版スタックではなくネイティブPostgresで検証)。RLSポリシーは`authenticated`ロールへのなりすまし経由で複数ユーザーシナリオをテスト済み。

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

### Sprint 4(収益化・PWA・磨き込み)

- [x] Stripe統合: ユーザーPremiumサブスク(`/mypage`から購入・請求管理ポータルへの導線)+ Webhook(`/api/webhooks/stripe`)で`subscriptions`/`users.plan`を同期
- [x] 無料/プレミアムのプラン制限(チェックイン1日1回・合流リクエスト1日3件、フィードでのプレミアムブースト表示)
- [x] 管理画面: クーポン管理(`/admin/shops/[id]`、提携店のみ)
- [x] PWA化: マニフェスト・Service Worker(インストール可能に)・Push購読のキャプチャ(送信基盤はVAPID鍵未設定のため未実装)
- [x] 管理画面: KPIダッシュボード(`/admin/kpi`、DAU・チェックイン数・合流成立数(週次/累計)・課金者数)
- [x] 利用規約・プライバシーポリシー(`/terms`, `/privacy`。**要弁護士レビュー、草案である旨を明記**)

店舗プランは仕様書5.2の通り営業ベース(請求書払い併用)のため、Stripeでのセルフサーブ課金は実装していない(`/admin/shops`から手動設定)。

このSprint 4の実装中に、既存マイグレーションの実バグを3件発見・修正:

- `users`テーブルの自己更新ポリシーが`kyc_status = 'pending'`を要求しており、本人確認済みユーザー(=事実上全員)が自分のプロフィールを一切更新できなかった(0006で修正: システム管理列をトリガーで保護し、それ以外は自由に更新可能に)
- Stripe SDKはコンストラクタでAPIキーを即座に検証するため、モジュールトップレベルでインスタンス化するとAPIキー未設定時にビルド自体が失敗していた(遅延初期化に変更)
- `subscriptions.stripe_subscription_id`にUNIQUE制約が無く、Webhookのupsertが機能しない状態だった

### 未実装

Google Places連携(未登録店舗申請)、エリアタブ切替・「今夜のマップ」ビュー、Push通知の実際の送信基盤(VAPID鍵・配信スケジューラ)、イベント機能(Phase 3)。
