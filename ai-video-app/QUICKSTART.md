# 🚀 AI動画プラットフォーム クイックスタート

## 5分で始める方法

### 前提条件
- Node.js 18+ がインストール済み
- PostgreSQL がインストール済み
- Gitがインストール済み

### ステップ1: セットアップ（1分）

```bash
# セットアップスクリプトを実行
cd ai-video-app
chmod +x scripts/dev.sh
./scripts/dev.sh
```

### ステップ2: データベース作成（1分）

```bash
# データベース作成
createdb ai_video_app

# スキーマ適用
psql -d ai_video_app -f database/schema.sql

# サンプルデータ投入
psql -d ai_video_app -f database/seed.sql
```

### ステップ3: 最小限の環境設定（1分）

```bash
# バックエンド設定
cd backend
echo "DATABASE_URL=postgresql://localhost:5432/ai_video_app" >> .env
echo "JWT_SECRET=dev-secret-key" >> .env

# フロントエンド設定
cd ../frontend
# Stripeを使わない場合は、デフォルトのままでOK
```

### ステップ4: サーバー起動（2分）

**ターミナル1:**
```bash
cd backend
npm run dev
```

**ターミナル2:**
```bash
cd frontend
npm run dev
```

### ステップ5: アクセス

ブラウザで http://localhost:5173 を開く

## 🎯 最初に試すこと

1. **ユーザー登録**: 右上の「登録」ボタンから新規アカウント作成
2. **コンテンツ閲覧**: ホームページでコンテンツ一覧を確認
3. **動画再生**: サムネイルをクリックして動画詳細へ

## ⚠️ 注意事項

- これは開発環境用の設定です
- 本番環境では必ず環境変数を適切に設定してください
- Stripe決済機能を使うにはAPIキーが必要です

## 🆘 困ったときは

- ログを確認: `backend/logs/all.log`
- ポート競合: 5000番と5173番ポートが空いているか確認
- DB接続エラー: PostgreSQLが起動しているか確認

## 📚 詳細なセットアップ

詳しい設定方法は [docs/SETUP.md](docs/SETUP.md) を参照してください。