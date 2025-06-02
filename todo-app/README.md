# シンプルTodoアプリ

このプロジェクトは、Node.js と Express を使用したシンプルなTodoアプリケーションです。

## 機能

- ✅ タスクの追加
- ✅ タスクの完了/未完了の切り替え
- ✅ タスクの削除
- ✅ タスクのフィルタリング（すべて/未完了/完了済み）
- ✅ 未完了タスク数の表示
- ✅ レスポンシブデザイン

## 技術スタック

### フロントエンド
- HTML5
- CSS3
- Vanilla JavaScript
- Fetch API

### バックエンド
- Node.js
- Express.js
- CORS

## セットアップ

1. 依存関係のインストール:
```bash
cd todo-app
npm install
```

2. サーバーの起動:
```bash
npm start
```

または開発モード（自動リロード付き）:
```bash
npm run dev
```

3. ブラウザで `http://localhost:3000` を開く

## API エンドポイント

- `GET /api/todos` - すべてのTodoを取得
- `POST /api/todos` - 新しいTodoを作成
- `PUT /api/todos/:id` - Todoの完了状態を更新
- `DELETE /api/todos/:id` - Todoを削除

## プロジェクト構造

```
todo-app/
├── package.json
├── server.js          # Express サーバー
├── public/            # 静的ファイル
│   ├── index.html     # メインHTML
│   ├── style.css      # スタイルシート
│   └── app.js         # フロントエンドJavaScript
└── README.md          # このファイル
```

## 注意事項

- データはメモリ内に保存されるため、サーバーを再起動するとデータは失われます
- 本番環境での使用には、データベースの実装が必要です

## ライセンス

MIT