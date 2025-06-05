# TeleAI Pro API Integration

このモジュールは、TeleAI Pro APIとの統合を提供します。音声転写、感情分析、要約抽出などの機能を含みます。

## 機能

- **音声転写** (`/transcribe`) - 音声データをテキストに変換
- **感情分析** (`/analyze-sentiment`) - テキストの感情を分析
- **要約抽出** (`/extract-summary`) - 長文から要約を生成
- **ヘルスチェック** (`/health`) - APIの状態を確認

## 主な特徴

- **認証**: Bearer tokenによる安全な認証
- **レート制限**: 100リクエスト/分の自動制限
- **リトライロジック**: 指数バックオフによる最大3回の自動リトライ
- **タイムアウト**: 30秒のデフォルトタイムアウト

## 使用方法

```typescript
import { TeleAIClient } from './teleai';

// クライアントの初期化
const client = new TeleAIClient({
  apiBaseUrl: 'https://teleai-pro-api.onrender.com',
  bearerToken: process.env.TELEAI_API_TOKEN!,
  timeout: 30000, // オプション: タイムアウト（ミリ秒）
  maxRetries: 3,  // オプション: 最大リトライ回数
});

// 音声転写
const transcription = await client.transcribe({
  audio: audioBuffer, // BufferまたはBase64文字列
  language: 'ja',     // オプション: 言語コード
});

// 感情分析
const sentiment = await client.analyzeSentiment({
  text: 'これは素晴らしい製品です！',
  language: 'ja',
});

// 要約抽出
const summary = await client.extractSummary({
  text: longText,
  maxLength: 200,      // オプション: 最大文字数
  style: 'bullets',    // オプション: 'bullets' または 'paragraph'
});

// ヘルスチェック
const health = await client.checkHealth();
```

## エラーハンドリング

APIクライアントは、以下のエラー情報を含む構造化されたエラーを返します：

```typescript
interface APIError {
  code: string;           // エラーコード
  message: string;        // エラーメッセージ
  statusCode: number;     // HTTPステータスコード
  details?: Record<string, unknown>; // 追加の詳細情報
}
```

### リトライ可能なエラー

以下のエラーは自動的にリトライされます：
- `408` - リクエストタイムアウト
- `429` - レート制限超過
- `5xx` - サーバーエラー

## テスト

### ユニットテスト

```bash
bun test test/teleai/
```

### 統合テスト

統合テストを実行するには、環境変数を設定してください：

```bash
export TELEAI_API_TOKEN=your-api-token
export TELEAI_API_URL=https://teleai-pro-api.onrender.com
bun test test/teleai/integration.test.ts
```

## 設定

### 環境変数

- `TELEAI_API_TOKEN` - TeleAI Pro APIの認証トークン
- `TELEAI_API_URL` - APIのベースURL（オプション）

### タイムアウトとリトライの調整

```typescript
const client = new TeleAIClient({
  apiBaseUrl: 'https://teleai-pro-api.onrender.com',
  bearerToken: 'your-token',
  timeout: 60000,    // 60秒のタイムアウト
  maxRetries: 5,     // 最大5回のリトライ
});
```

## パフォーマンス

- レート制限により、1分間に最大100リクエストまで処理可能
- 自動リトライにより、一時的な障害に対する耐性を提供
- 非同期処理により、複数のリクエストを効率的に処理

## セキュリティ

- Bearer tokenは環境変数に保存することを推奨
- すべての通信はHTTPS経由で暗号化
- タイムアウト設定により、無限待機を防止