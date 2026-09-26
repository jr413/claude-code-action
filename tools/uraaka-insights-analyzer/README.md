# UraAka Insights Analyzer（裏垢男子成功分析ツール）

公開されている投稿データをもとに、アカウントの投稿傾向・エンゲージメントパターンを分析し、
自分自身の**手動運用**の改善に役立てるための分析ダッシュボードです。

## このツールが行わないこと

- 投稿・いいね・フォロー・DM などの自動化は一切行いません
- 特定の個人をターゲティングしたり、DM 送信を支援したりする機能はありません
- 収集するのは公開されている投稿データのみです

## セットアップ

```bash
cd tools/uraaka-insights-analyzer
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

X API を使う場合は Bearer Token を設定します（任意）。

```bash
export X_BEARER_TOKEN="your-bearer-token"
```

トークンがなくても、CSV アップロードや手動入力で全機能を使えます。

## 起動

```bash
streamlit run app.py
```

## データ収集方法

1. **公式 X API v2（任意）**: ユーザー名から直近の投稿を取得します。取得範囲は契約プランに依存します。
2. **CSV アップロード**: 必須列は `account_username, text, created_at, like_count, repost_count, quote_count, reply_count` です。
3. **手動入力**: フォームから1件ずつ登録します。

## 主な機能

- 投稿傾向分析（時間帯ヒートマップ、コンテンツ分類、メディア利用率、ハッシュタグ）
- 人気投稿の特徴抽出と参考インサイト
- 複数アカウント比較と、自分のアカウントとの差分
- CSV / PDF エクスポート

PDF で日本語を表示するには、IPAゴシック・Noto Sans CJK・ヒラギノ・メイリオのいずれかが OS に入っている必要があります。

## テスト

```bash
pip install pytest
python -m pytest tests/
```

## データの保存場所

ローカルの `data/uraaka_insights.db`（SQLite）に保存されます。外部送信は行いません。
