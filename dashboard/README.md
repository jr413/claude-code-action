# TeleAI エグゼクティブダッシュボード

リアルタイムアナリティクスとデータ可視化のためのエグゼクティブダッシュボードインターフェース。

## 機能

### 主要機能
- **リアルタイムKPI表示**: 総通話数、平均通話時間、アクティブユーザー、満足度スコア
- **データ可視化**: Chart.jsを使用した通話数推移とユーザー分布のチャート
- **通話履歴テーブル**: 最近の通話履歴を表形式で表示
- **オーディオプレイヤー**: 通話録音の再生機能
- **データエクスポート**: CSV、JSON、PDF形式でのデータエクスポート
- **リアルタイム更新**: WebSocketまたはポーリングによる自動更新（30秒間隔）

### 技術仕様
- **レスポンシブデザイン**: モバイルファーストアプローチ
- **アクセシビリティ**: WCAG 2.1 AA準拠
- **パフォーマンス**: 遅延読み込みと効率的なレンダリング
- **ブラウザサポート**: モダンブラウザ対応

## セットアップ

### 1. 基本的な使用方法
```bash
# ローカルサーバーで実行
cd dashboard
python -m http.server 8000
# または
npx serve .
```

ブラウザで `http://localhost:8000` にアクセスしてください。

### 2. API接続設定
`app.js` の以下の部分を実際のAPIエンドポイントに更新してください：

```javascript
const API_BASE_URL = 'https://teleai-pro-api.onrender.com';
```

### 3. WebSocket設定
リアルタイム更新のために、WebSocket接続を有効にしてください：

```javascript
wsConnection = new WebSocket('wss://teleai-pro-api.onrender.com/ws');
```

## ファイル構成

```
dashboard/
├── index.html      # メインHTMLファイル
├── styles.css      # スタイルシート
├── app.js          # JavaScriptアプリケーション
└── README.md       # このファイル
```

## カスタマイズ

### カラーテーマ
`styles.css` のCSS変数を編集してカラーテーマをカスタマイズできます：

```css
:root {
    --primary-color: #2563eb;
    --secondary-color: #3b82f6;
    --success-color: #10b981;
    --danger-color: #ef4444;
}
```

### データ更新間隔
`app.js` の `REFRESH_INTERVAL` を変更して更新間隔を調整できます：

```javascript
const REFRESH_INTERVAL = 30000; // ミリ秒単位
```

## APIエンドポイント

ダッシュボードは以下のAPIエンドポイントを使用します：

- `GET /api/dashboard/summary` - ダッシュボードサマリーデータ
- `WS /ws` - リアルタイム更新用WebSocket接続

## ブラウザ要件

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。