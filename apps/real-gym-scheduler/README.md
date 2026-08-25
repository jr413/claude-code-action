# REAL ジム スケジューラー

ジム「REAL」に行く予定を合わせるためのカレンダーアプリ。

- 月間カレンダーで各メンバーが「行ける時間帯」を入力
- 営業時間: 火曜定休、日曜 12:00〜19:30、それ以外 12:00〜23:00（この範囲外は入力不可）
- メンバー全員の時間帯が重なる日はカレンダー上でハイライト表示
- ログインなし。初回に自分の名前を選ぶだけ（端末に記憶される）
- 名前選択画面から新しいメンバーをいつでも追加可能（色は自動で割り当て）

## セットアップ

### 1. Supabase プロジェクトを作成

1. https://supabase.com で無料プロジェクトを作成
2. SQL Editor で `supabase/schema.sql` の内容を実行し、`members` / `slots` テーブルを作成
3. 「Project Settings > API」から Project URL と anon public key を控える

すでに `slots` テーブルだけ作成済み（メンバー追加機能より前のバージョン）の場合は、
代わりに `supabase/migrate_add_members_table.sql` を SQL Editor で実行してください。

💡 **Suggestion**: Supabaseのアカウント作成・プロジェクト発行はブラウザでの操作が必要なため、ユーザー自身で行ってください。

### 2. 環境変数を設定

```bash
cp .env.example .env
```

`.env` に控えた URL と anon key を設定する。

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx
```

### 3. 起動

```bash
bun install
bun run dev
```

## 注意事項

- 身内だけで使う想定のため、Supabase の匿名キーで誰でも読み書きできる設定になっている（認証なし）。不特定多数に公開する場合はメンバー認証の追加が必要。
- 1人1日1件の予定のみ登録可能（同じ日に再登録すると上書きされる）。
