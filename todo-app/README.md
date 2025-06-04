# シンプルTodoアプリ

Express.jsとVanilla JavaScriptで作成されたシンプルなTodoアプリケーションです。

## 機能

- ✅ タスクの追加
- ✅ タスクの完了/未完了切り替え
- ✅ タスクの削除
- ✅ フィルタリング（すべて/未完了/完了済み）
- ✅ 未完了タスク数の表示
- ✅ レスポンシブデザイン

## 技術スタック

- **バックエンド**: Node.js + Express.js
- **フロントエンド**: Vanilla JavaScript (フレームワーク未使用)
- **スタイリング**: CSS3
- **データ保存**: メモリ内（サーバー再起動でリセット）

## セットアップ

1. 依存関係のインストール
```bash
npm install
```

2. サーバーの起動
```bash
npm start
```

3. ブラウザでアクセス
```
http://localhost:3000
```

## 開発モード

nodemonを使用した自動リロード機能付き開発モード：
```bash
npm run dev
```

## API エンドポイント

- `GET /api/todos` - すべてのTodoを取得
- `POST /api/todos` - 新しいTodoを作成
- `PATCH /api/todos/:id` - Todoの完了状態を更新
- `DELETE /api/todos/:id` - Todoを削除

## プロジェクト構造

```
todo-app/
├── package.json
├── server.js         # Expressサーバー
├── public/          # 静的ファイル
│   ├── index.html   # メインHTML
│   ├── style.css    # スタイルシート
│   └── app.js       # フロントエンドロジック
└── README.md        # このファイル
```