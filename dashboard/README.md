# TeleAI エグゼクティブダッシュボード

リアルタイム分析機能を備えた日本語対応のエグゼクティブダッシュボードです。

## 機能

### 🎯 主要機能
- **リアルタイムメトリクス表示**: 売上、ユーザー数、応答時間などの主要KPIをリアルタイム更新
- **インタラクティブチャート**: Chart.jsを使用した美しいグラフ表示
- **データテーブル**: ソート可能な顧客データ一覧
- **オーディオプレーヤー**: 録音ファイルの再生機能
- **エクスポート機能**: CSV、JSON、PDF形式でのデータエクスポート

### 🔐 認証
- OAuth認証（GitHub）を使用
- 既存のOAuth認証システムと統合

### 📱 レスポンシブデザイン
- モバイルファーストアプローチ
- Tailwind CSSによる美しいUI
- WCAG 2.1 AA準拠のアクセシビリティ

### 🔄 リアルタイム更新
- WebSocket接続によるリアルタイムデータ更新
- 自動再接続機能

## セットアップ

1. 依存関係のインストール:
```bash
cd dashboard
npm install
```

2. 環境変数の設定:
`.env`ファイルを作成し、以下を設定:
```
VITE_WS_URL=wss://your-websocket-url
VITE_API_URL=https://your-api-url
```

3. 開発サーバーの起動:
```bash
npm run start
```

4. ビルド:
```bash
npm run build
```

## 技術スタック

- **React 18** + **TypeScript**
- **Vite** - 高速な開発環境
- **Tailwind CSS** - ユーティリティファーストCSS
- **Chart.js** - グラフ表示
- **Socket.IO Client** - WebSocket通信
- **React Router** - ルーティング

## ディレクトリ構造

```
dashboard/
├── src/
│   ├── components/      # UIコンポーネント
│   ├── hooks/          # カスタムフック
│   ├── types/          # TypeScript型定義
│   └── utils/          # ユーティリティ関数
├── public/             # 静的ファイル
└── dist/              # ビルド出力
```

## 開発

### コードスタイル
- ESLint + Prettierでコードフォーマット
- TypeScriptの厳格な型チェック

### コマンド
- `npm run start` - 開発サーバー起動
- `npm run build` - プロダクションビルド
- `npm run lint` - ESLintチェック
- `npm run type-check` - TypeScript型チェック

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。