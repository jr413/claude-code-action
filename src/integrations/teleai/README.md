# TeleAI Pro API 統合

このディレクトリには、TeleAI Pro APIとの統合に必要なコードが含まれています。

## 概要

TeleAI Pro APIは、以下の機能を提供する音声・テキスト処理APIです：

- **音声文字起こし** - 音声データをテキストに変換
- **感情分析** - テキストの感情を分析
- **要約抽出** - 長いテキストから要約を生成
- **ヘルスチェック** - サービスの稼働状態を確認

## 主な機能

### 1. 認証
- Bearer tokenによる認証
- 環境変数`TELEAI_API_KEY`からAPIキーを取得

### 2. レート制限
- 100リクエスト/分の制限
- 自動的な待機処理
- レート制限情報の取得

### 3. エラーハンドリング
- 指数バックオフによる自動リトライ（最大3回）
- タイムアウト処理（デフォルト30秒）
- 詳細なエラー情報の提供

### 4. タイプセーフ
- TypeScriptによる完全な型定義
- リクエスト/レスポンスの型安全性

## 使用方法

### 基本的な使い方

```typescript
import { TeleAIClient } from './integrations/teleai';

// クライアントの初期化
const client = new TeleAIClient({
  baseUrl: 'https://teleai-pro-api.onrender.com',
  apiKey: process.env.TELEAI_API_KEY!,
});

// 音声文字起こし
const transcribeResult = await client.transcribe({
  audio: 'base64エンコードされた音声データ',
  format: 'mp3',
  language: 'ja',
});
console.log('文字起こし結果:', transcribeResult.text);

// 感情分析
const sentimentResult = await client.analyzeSentiment({
  text: '今日はとても良い天気ですね！',
  language: 'ja',
});
console.log('感情スコア:', sentimentResult.score);
console.log('感情ラベル:', sentimentResult.label);

// 要約抽出
const summaryResult = await client.extractSummary({
  text: '長いテキスト...',
  maxLength: 200,
  type: 'extractive',
  language: 'ja',
});
console.log('要約:', summaryResult.summary);

// ヘルスチェック
const health = await client.health();
console.log('サービス状態:', health.status);
```

### レート制限情報の確認

```typescript
const rateLimitInfo = client.getRateLimitInfo();
console.log('残りリクエスト数:', rateLimitInfo.remaining);
console.log('リセット時刻:', new Date(rateLimitInfo.reset * 1000));
```

### カスタム設定

```typescript
const client = new TeleAIClient({
  baseUrl: 'https://teleai-pro-api.onrender.com',
  apiKey: process.env.TELEAI_API_KEY!,
  timeout: 60000,        // 60秒のタイムアウト
  rateLimit: 50,         // 50リクエスト/分
  maxRetries: 5,         // 最大5回リトライ
});
```

## エラーハンドリング

```typescript
try {
  const result = await client.transcribe(request);
} catch (error: any) {
  console.error('エラーコード:', error.code);
  console.error('エラーメッセージ:', error.message);
  
  if (error.status === 429) {
    console.log('レート制限に達しました。しばらく待ってから再試行してください。');
  }
  
  if (error.retryable) {
    console.log('このエラーはリトライ可能です。');
  }
}
```

## ファイル構成

```
src/integrations/teleai/
├── index.ts           # エクスポート定義
├── types.ts           # 型定義
├── client.ts          # APIクライアント実装
├── rate-limiter.ts    # レート制限機能
├── retry-handler.ts   # リトライ処理
└── README.md          # このドキュメント
```

## 環境変数

以下の環境変数を設定してください：

```bash
# 必須
TELEAI_API_KEY=your-api-key-here

# オプション（デフォルト値あり）
TELEAI_API_BASE_URL=https://teleai-pro-api.onrender.com
TELEAI_TIMEOUT=30000
TELEAI_RATE_LIMIT=100
TELEAI_MAX_RETRIES=3
```

## テスト

```bash
# テストの実行
bun test src/integrations/teleai

# カバレッジレポート付きテスト
bun test --coverage src/integrations/teleai
```

## 注意事項

1. **APIキーの管理**: APIキーは絶対にコードにハードコーディングしないでください
2. **レート制限**: APIの利用制限を守るため、大量のリクエストを送信する場合は適切な間隔を空けてください
3. **エラー処理**: ネットワークエラーや一時的な障害に備えて、適切なエラー処理を実装してください
4. **データサイズ**: 大きな音声ファイルやテキストを処理する場合は、タイムアウト値を調整してください

## サポート

問題や質問がある場合は、以下のリソースを参照してください：

- [TeleAI Pro API ドキュメント](https://teleai-pro-api.onrender.com/docs)
- [GitHub Issues](https://github.com/jr413/claude-code-action/issues)