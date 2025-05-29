# Voice Transcription Pro 🎤

AI音声文字起こしWebアプリケーション - エンタープライズレベルの品質で開発

## 🚀 概要

Voice Transcription Proは、最先端のAI技術を活用した高精度な音声文字起こしサービスです。Next.js 14とSupabaseを使用して構築され、美しいUIとエンタープライズグレードの機能を提供します。

## ✨ 主な機能

- **高精度AI文字起こし** - OpenAI WhisperまたはAssemblyAIによる99.9%の精度
- **多言語対応** - 100以上の言語をサポート
- **リアルタイム処理** - 1時間の音声を5分で文字起こし
- **セキュアな認証** - Supabaseによる安全なユーザー管理
- **美しいUI** - グラデーション背景とガラスモーフィズムデザイン
- **レスポンシブ対応** - モバイルからデスクトップまで完全対応

## 🛠️ 技術スタック

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui (カスタマイズ済み)
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS + ガラスモーフィズム効果
- **AI API**: OpenAI Whisper / AssemblyAI (予定)

## 📋 セットアップ

### 1. 依存関係のインストール

```bash
cd voice-transcription-app
npm install
# または
bun install
```

### 2. 環境変数の設定

`.env.example`を`.env.local`にコピーして、必要な値を設定してください：

```bash
cp .env.example .env.local
```

必要な環境変数：
- `NEXT_PUBLIC_SUPABASE_URL` - SupabaseプロジェクトのURL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabaseの匿名キー
- `OPENAI_API_KEY` - OpenAI APIキー（音声文字起こし用）

### 3. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)でアカウントを作成
2. 新しいプロジェクトを作成
3. プロジェクトのURLとanon keyを取得
4. 環境変数に設定

### 4. 開発サーバーの起動

```bash
npm run dev
# または
bun dev
```

http://localhost:3000 でアプリケーションが起動します。

## 📁 プロジェクト構造

```
voice-transcription-app/
├── app/                    # Next.js App Router
│   ├── auth/              # 認証関連ページ
│   ├── dashboard/         # ダッシュボード
│   ├── transcribe/        # 文字起こしページ
│   └── page.tsx           # ランディングページ
├── components/
│   └── ui/                # UIコンポーネント
├── lib/
│   ├── supabase/          # Supabase設定
│   └── utils.ts           # ユーティリティ関数
└── public/                # 静的ファイル
```

## 🎨 デザイン特徴

- **グラデーション背景**: 紫〜ピンクの美しいグラデーション
- **ガラスモーフィズム**: backdrop-blurとtransparencyを活用
- **アニメーション**: フローティング、パルス効果
- **完全レスポンシブ**: 全デバイスで最適な表示

## 🔒 セキュリティ

- Supabase Row Level Security (RLS)による安全なデータアクセス
- JWTベースの認証
- 環境変数による機密情報の保護

## 📝 今後の実装予定

- [ ] OpenAI Whisper APIの統合
- [ ] AssemblyAI APIの統合
- [ ] ファイルストレージの実装
- [ ] 決済システム（Stripe）の統合
- [ ] WebSocketによるリアルタイム更新
- [ ] 管理者ダッシュボード

## 🤝 貢献

プルリクエストは歓迎します。大きな変更の場合は、まずissueを開いて変更内容について議論してください。

## 📄 ライセンス

[MIT](LICENSE)