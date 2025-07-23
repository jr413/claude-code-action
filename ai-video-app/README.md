# AI動画ストリーミングプラットフォーム

動画ストリーミングプラットフォームのMVP実装です。

## プロジェクト構造

```
ai-video-app/
├── backend/          # Express + TypeScript バックエンド
├── frontend/         # React + Vite フロントエンド
├── database/         # PostgreSQL スキーマとマイグレーション
├── docs/            # ドキュメント
└── scripts/         # 開発用スクリプト
```

## セットアップ手順

### 1. 依存関係のインストール

```bash
# バックエンドの依存関係
cd backend
npm install

# フロントエンドの依存関係
cd ../frontend
npm install
```

### 2. 環境変数の設定

```bash
# バックエンド環境変数
cd backend
cp .env.example .env
# .envファイルを編集して必要な値を設定

# フロントエンド環境変数
cd ../frontend
cp .env.example .env
# .envファイルを編集して必要な値を設定
```

### 3. データベースのセットアップ

```bash
# PostgreSQLデータベースを作成
createdb ai_video_app

# スキーマを適用
cd database
psql -d ai_video_app -f schema.sql

# 初期データを投入（オプション）
psql -d ai_video_app -f seed.sql
```

### 4. 開発サーバーの起動

```bash
# 別々のターミナルで実行

# バックエンド
cd backend
npm run dev

# フロントエンド
cd frontend
npm run dev
```

## 技術スタック

- **バックエンド**: Node.js, Express, TypeScript
- **フロントエンド**: React, Vite, Tailwind CSS
- **データベース**: PostgreSQL
- **認証**: JWT
- **決済**: Stripe
- **動画配信**: HLS

## 環境変数

### バックエンド (.env)

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ai_video_app

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS (オプション)
AWS_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=

# Email (オプション)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
```

### フロントエンド (.env)

```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

## APIエンドポイント

- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン
- `GET /api/content` - コンテンツ一覧
- `GET /api/content/:id` - コンテンツ詳細
- `POST /api/payment/create-session` - 決済セッション作成
- `GET /api/user/profile` - ユーザープロフィール

## 開発者向け情報

- ESLintとPrettierが設定済み
- TypeScriptの厳格モード有効
- Jestでのテスト環境構築済み