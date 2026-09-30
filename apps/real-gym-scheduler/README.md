# REAL ジム スケジューラー

ジム「REAL」に行く予定を合わせるためのカレンダーアプリ。

- 月間カレンダーで各メンバーが「行ける時間帯」を入力
- 営業時間: 火曜定休、日曜 12:00〜19:30、それ以外 12:00〜23:00（この範囲外は入力不可）
- メンバー全員の時間帯が重なる日はカレンダー上でハイライト表示
- ログインなし。初回に自分の名前を選ぶだけ（端末に記憶される）
- 名前選択画面から新しいメンバーをいつでも追加可能（色は自動で割り当て）

データベースは Cloudflare D1（Workerに直接バインドする無料のSQLite）を使っています。
Supabaseのような外部サービスのURL・APIキーの設定は不要です。

## セットアップ（Cloudflare）

### 1. D1データベースを作成

1. Cloudflareダッシュボード →「Workers & Pages」→「D1」→「Create database」
2. 名前は `real-gym-scheduler` など好きなものでOK
3. 作成後に表示される **Database ID** を控える

💡 **Suggestion**: Cloudflareアカウント作成・データベース発行はブラウザでの操作が必要なため、ユーザー自身で行ってください。

### 2. wrangler.jsonc にDatabase IDを設定

`wrangler.jsonc` の `d1_databases[0].database_id` を、手順1で控えたIDに書き換える。

### 3. テーブルを作成

D1データベースの「Console」タブで `d1/schema.sql` の内容を実行するか、次のコマンドで実行する。

```bash
npx wrangler d1 execute real-gym-scheduler --remote --file=d1/schema.sql
```

### 4. デプロイ

```bash
npm run deploy
```

`npm run build` → `wrangler deploy` を続けて実行する。
**`wrangler deploy` 単体はビルドし直さない**ので、必ず `npm run deploy` を使うこと
（ビルド忘れだと古い `dist/` がそのままアップロードされる）。
Cloudflareダッシュボード側のGit連携による自動デプロイは使わない（別リポジトリのコピーを見ていて同期されないため）。

### 5. ローカル開発

```bash
npm install
npm run dev:worker
```

`wrangler dev` はローカル用のD1を自動で用意するので、追加設定なしでAPIごと動作確認できる
（`vite` 単体だとAPI（`/api/*`）が無いのでデータの読み書きができない点に注意）。

## Cloudflare CLI（wrangler）早見表

初回だけログインする（ブラウザが開いて認可するだけ。以降は不要）。

```bash
npx wrangler login
npx wrangler whoami          # ログイン中のアカウント確認
```

| やりたいこと                   | コマンド                                                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| ビルド+デプロイ                | `npm run deploy`                                                                                                                   |
| ローカルで動作確認             | `npm run dev:worker`                                                                                                               |
| 本番DBにテーブル作成           | `npm run d1:schema`                                                                                                                |
| 本番DBの中身を見る             | `npx wrangler d1 execute real-gym-scheduler --remote --command "select * from members"`                                            |
| 本番の予定を見る               | `npx wrangler d1 execute real-gym-scheduler --remote --command "select * from slots order by slot_date"`                           |
| 本番の予定を1件消す            | `npx wrangler d1 execute real-gym-scheduler --remote --command "delete from slots where member='佐藤' and slot_date='2026-10-07'"` |
| Workerのログをリアルタイム表示 | `npx wrangler tail real-gym-scheduler`                                                                                             |
| 直前のデプロイに戻す           | `npx wrangler rollback`                                                                                                            |

`--remote` を付けないとローカル用のD1が対象になる。本番を触るときは必ず付ける。

## 注意事項

- 身内だけで使う想定のため、認証なしで誰でも読み書きできる設定になっている。不特定多数に公開する場合はメンバー認証の追加が必要。
- 1人1日1件の予定のみ登録可能（同じ日に再登録すると上書きされる）。
- リアルタイム同期ではなく5秒間隔のポーリングで最新状態を取得している。
