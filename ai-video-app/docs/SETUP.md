# AI動画プラットフォーム セットアップガイド

## 必要な環境

- Node.js v18以上
- PostgreSQL 14以上
- npm または yarn
- Git

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/jr413/claude-code-action.git
cd claude-code-action/ai-video-app
```

### 2. セットアップスクリプトの実行

```bash
chmod +x scripts/dev.sh
./scripts/dev.sh
```

このスクリプトは以下を自動で行います：
- 依存関係のインストール
- 環境設定ファイルの作成
- 初期設定の確認

### 3. データベースのセットアップ

#### データベースの作成

```bash
createdb ai_video_app
```

#### スキーマの適用

```bash
psql -d ai_video_app -f database/schema.sql
```

#### サンプルデータの投入（開発環境のみ）

```bash
psql -d ai_video_app -f database/seed.sql
```

### 4. 環境変数の設定

#### バックエンド（backend/.env）

以下の値を設定してください：

```env
# データベース接続
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/ai_video_app

# JWT秘密鍵（本番環境では必ず変更）
JWT_SECRET=your-super-secret-jwt-key-change-this

# Stripe（決済）
STRIPE_SECRET_KEY=sk_test_... # Stripeダッシュボードから取得
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook作成後に取得
```

#### フロントエンド（frontend/.env）

```env
# Stripe公開鍵
VITE_STRIPE_PUBLIC_KEY=pk_test_... # Stripeダッシュボードから取得
```

### 5. 開発サーバーの起動

2つのターミナルウィンドウで以下を実行：

#### バックエンド

```bash
cd backend
npm run dev
```

バックエンドは http://localhost:5000 で起動します。

#### フロントエンド

```bash
cd frontend
npm run dev
```

フロントエンドは http://localhost:5173 で起動します。

## 外部サービスの設定

### Stripe（決済）

1. [Stripe](https://stripe.com)でアカウント作成
2. ダッシュボードからAPIキーを取得
3. Webhookエンドポイントを設定:
   - URL: `http://your-domain.com/api/payment/webhook`
   - イベント: `checkout.session.completed`

### AWS S3（動画ストレージ）

1. S3バケットを作成
2. CORS設定を追加
3. IAMユーザーを作成し、アクセスキーを取得
4. 環境変数に設定

## トラブルシューティング

### PostgreSQLに接続できない

```bash
# PostgreSQLが起動しているか確認
pg_ctl status

# 起動していない場合
pg_ctl start
```

### 依存関係のインストールエラー

```bash
# キャッシュをクリア
npm cache clean --force

# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

### ポートが使用中

```bash
# 使用中のポートを確認
lsof -i :5000  # バックエンド
lsof -i :5173  # フロントエンド

# プロセスを終了
kill -9 <PID>
```

## 本番環境へのデプロイ

### 推奨構成

- **バックエンド**: AWS EC2 / ECS
- **フロントエンド**: AWS CloudFront + S3
- **データベース**: AWS RDS (PostgreSQL)
- **動画ストレージ**: AWS S3
- **CDN**: AWS CloudFront

### セキュリティチェックリスト

- [ ] 環境変数をAWS Secrets Managerで管理
- [ ] HTTPSを有効化
- [ ] WAFを設定
- [ ] データベースのバックアップ設定
- [ ] ログ監視設定（CloudWatch）
- [ ] DDoS対策（AWS Shield）

## 開発のヒント

### データベースマイグレーション

新しいテーブルやカラムを追加する場合：

```sql
-- migrations/001_add_new_feature.sql として保存
ALTER TABLE users ADD COLUMN new_column VARCHAR(255);
```

### APIのテスト

```bash
# ヘルスチェック
curl http://localhost:5000/health

# ユーザー登録
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","username":"testuser","age_confirmed":true}'
```

### ログの確認

```bash
# バックエンドログ
tail -f backend/logs/all.log

# エラーログのみ
tail -f backend/logs/error.log
```