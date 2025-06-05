/**
 * オーディオ処理ワークフローエンジンの型定義
 */

/**
 * 処理タスクの状態
 */
export enum TaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * オーディオ処理タスクのインターフェース
 */
export interface AudioTask {
  id: string;
  correlationId: string;
  status: TaskStatus;
  data: any;
  result?: any;
  error?: Error;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  retryCount: number;
  maxRetries: number;
}

/**
 * タスクプロセッサーのインターフェース
 */
export interface TaskProcessor<T = any, R = any> {
  process(data: T): Promise<R>;
}

/**
 * ワークフローエンジンの設定
 */
export interface WorkflowConfig {
  concurrency: number;
  maxRetries: number;
  retryDelay: number;
  healthCheckInterval: number;
}

/**
 * メトリクスデータ
 */
export interface Metrics {
  totalTasks: number;
  pendingTasks: number;
  processingTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageProcessingTime: number;
  throughput: number;
}

/**
 * ヘルスチェックの結果
 */
export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  metrics: Metrics;
  errors: string[];
  lastCheck: Date;
}

/**
 * キューイベントのタイプ
 */
export enum QueueEvent {
  TASK_ADDED = 'task:added',
  TASK_STARTED = 'task:started',
  TASK_COMPLETED = 'task:completed',
  TASK_FAILED = 'task:failed',
  TASK_RETRYING = 'task:retrying'
}

/**
 * ロガーインターフェース
 */
export interface Logger {
  info(message: string, meta?: any): void;
  error(message: string, error?: Error, meta?: any): void;
  warn(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}