# Audio Processing Workflow Engine

高性能なオーディオ処理ワークフローエンジンです。キュー管理、並列処理、エラーリカバリー、モニタリング機能を備えています。

## 機能

- **インメモリキューシステム** - 高速なジョブ管理
- **並列処理** - 設定可能な同時実行数
- **自動リトライ** - 失敗したジョブの自動再試行
- **ヘルスチェック** - システムの健全性監視
- **メトリクス収集** - パフォーマンス指標の追跡
- **構造化ログ** - コリレーションID付きログ

## インストール

```bash
bun install
```

## 基本的な使い方

```typescript
import { AudioWorkflowEngine } from './src/audio-workflow';

// エンジンの初期化
const engine = new AudioWorkflowEngine({
  queueOptions: {
    maxConcurrency: 5,
    retryLimit: 3,
    retryDelay: 1000
  }
});

// ワーカーの追加
engine.addWorker({ id: 'worker-1', concurrency: 2 });
engine.addWorker({ id: 'worker-2', concurrency: 3 });

// ジョブの追加
const job = engine.enqueueJob({
  audioFile: 'path/to/audio.mp3',
  settings: {
    format: 'wav',
    bitrate: 320
  }
});

// ジョブのステータス確認
const status = engine.getJob(job.id);
console.log(status);
```

## カスタムプロセッサー

独自の処理ロジックを実装できます：

```typescript
engine.setProcessor(async (job) => {
  // カスタム処理ロジック
  const result = await processAudio(job.data);
  return result;
});
```

## モニタリング

### ヘルスチェック

```typescript
const health = engine.getHealthStatus();
console.log(health);
// {
//   status: 'healthy',
//   queueSize: 10,
//   activeWorkers: 2,
//   completedJobs: 150,
//   failedJobs: 3,
//   uptime: 3600000
// }
```

### メトリクス

```typescript
const metrics = engine.getMetrics();
console.log(metrics);
// {
//   totalJobs: 163,
//   completedJobs: 150,
//   failedJobs: 3,
//   averageProcessingTime: 1234,
//   queueDepth: 10,
//   activeWorkers: 2
// }
```

### 定期的なヘルスチェック

```typescript
// 60秒ごとにヘルスチェックを実行
engine.startHealthMonitoring(60000);

// 停止
engine.stopHealthMonitoring();
```

## API リファレンス

### AudioWorkflowEngine

#### Constructor Options

```typescript
interface WorkflowEngineOptions {
  queueOptions?: {
    maxConcurrency?: number;  // デフォルト: 5
    retryLimit?: number;      // デフォルト: 3
    retryDelay?: number;      // デフォルト: 1000ms
  };
  workers?: WorkerOptions[];
}
```

#### Methods

- `enqueueJob(data: any): AudioJob` - ジョブをキューに追加
- `getJob(id: string): AudioJob | undefined` - ジョブの取得
- `setProcessor(processor: JobProcessor): void` - カスタムプロセッサーの設定
- `addWorker(options: WorkerOptions): void` - ワーカーの追加
- `getHealthStatus(): HealthStatus` - ヘルスステータスの取得
- `getMetrics(): Metrics` - メトリクスの取得
- `getQueueStats(): QueueStats` - キュー統計の取得
- `clearHistory(): void` - 完了/失敗ジョブの履歴をクリア
- `shutdown(): void` - エンジンのシャットダウン

### ジョブステータス

```typescript
enum JobStatus {
  PENDING = 'pending',      // 待機中
  PROCESSING = 'processing', // 処理中
  COMPLETED = 'completed',   // 完了
  FAILED = 'failed'         // 失敗
}
```

## ログ

構造化ログが自動的に出力されます：

```json
{
  "timestamp": "2025-06-04T00:00:00.000Z",
  "level": "info",
  "service": "AudioQueue",
  "correlationId": "corr-123456789",
  "message": "Job completed successfully",
  "jobId": "job-987654321",
  "processingTime": 1234
}
```

## テスト

```bash
# すべてのテストを実行
bun test

# 特定のテストファイルを実行
bun test test/audio-workflow/queue.test.ts
```

## パフォーマンス考慮事項

1. **メモリ使用量**: インメモリキューのため、大量のジョブがある場合はメモリ使用量に注意
2. **並列度**: CPUコア数に基づいて適切な並列度を設定
3. **リトライ戦略**: ネットワークエラーなど一時的な問題に対してのみリトライを使用

## 今後の改善点

- [ ] データベースバックエンドのサポート
- [ ] 分散処理のサポート
- [ ] WebSocket経由のリアルタイム通知
- [ ] より詳細なメトリクスとダッシュボード