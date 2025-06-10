# AI動画アプリ MVP

成人向けAI動画生成アプリケーションのMVP実装です。

## プロジェクト構造

```
ai-video-app/
├── frontend/       # React + Tailwind CSS フロントエンド
├── backend/        # Express + TypeScript バックエンド
├── database/       # PostgreSQL スキーマ
└── docs/          # ドキュメント
```

## 技術スタック

- **フロントエンド**: React, Tailwind CSS, Vite
- **バックエンド**: Node.js, Express, TypeScript
- **データベース**: PostgreSQL
- **認証**: JWT
- **決済**: Stripe
- **AI API**: Runway Gen3, Veo3 (モック実装)

## セットアップ

### 1. 環境変数の設定

バックエンドとフロントエンドの`.env.example`を`.env`にコピーして設定してください。

### 2. データベースのセットアップ

```bash
cd database
psql -U your_user -d your_database -f schema.sql
psql -U your_user -d your_database -f seed.sql
```

### 3. バックエンドの起動

```bash
cd backend
npm install
npm run dev
```

### 4. フロントエンドの起動

```bash
cd frontend
npm install
npm run dev
```

## 機能

- ユーザー認証（JWT）
- 年齢確認システム
- キャラクター・シナリオ選択
- AI動画生成（モック）
- Stripe決済統合
- 使用回数管理
- ユーザーダッシュボード

## セキュリティ

- 18歳未満アクセス制限
- データ暗号化
- HTTPS必須
- CSRFトークン保護

## ライセンス

Proprietary - All rights reserved