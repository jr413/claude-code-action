/**
 * オーディオ処理ワークフローエンジンの実装
 */

import { EventEmitter } from 'events';
import {
  AudioTask,
  TaskProcessor,
  WorkflowConfig,
  Metrics,
  HealthCheckResult,
  QueueEvent,
  Logger
} from './types';
import { InMemoryQueue } from './queue';
import { StructuredLogger, CorrelatedLogger } from './logger';

export class AudioWorkflowEngine extends EventEmitter {
  private queue: InMemoryQueue;
  private processors: Map<string, TaskProcessor>;
  private config: WorkflowConfig;
  private logger: Logger;
  private isRunning: boolean = false;
  private activeWorkers: number = 0;
  private healthCheckInterval?: NodeJS.Timer;
  private processingTimes: number[] = [];
  private startTime: Date;

  constructor(config: Partial<WorkflowConfig> = {}) {
    super();
    this.config = {
      concurrency: config.concurrency || 5,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      healthCheckInterval: config.healthCheckInterval || 30000
    };
    this.queue = new InMemoryQueue();
    this.processors = new Map();
    this.logger = new StructuredLogger('audio-workflow-engine');
    this.startTime = new Date();

    this.setupQueueListeners();
  }

  /**
   * キューイベントのリスナーを設定
   */
  private setupQueueListeners(): void {
    this.queue.on(QueueEvent.TASK_ADDED, (task: AudioTask) => {
      this.logger.info('Task added to queue', { taskId: task.id, correlationId: task.correlationId });
      this.emit('task:added', task);
    });

    this.queue.on(QueueEvent.TASK_STARTED, (task: AudioTask) => {
      this.logger.info('Task processing started', { taskId: task.id, correlationId: task.correlationId });
      this.emit('task:started', task);
    });

    this.queue.on(QueueEvent.TASK_COMPLETED, (task: AudioTask) => {
      const processingTime = task.completedAt!.getTime() - task.startedAt!.getTime();
      this.processingTimes.push(processingTime);
      if (this.processingTimes.length > 100) {
        this.processingTimes.shift();
      }
      this.logger.info('Task completed', { 
        taskId: task.id, 
        correlationId: task.correlationId,
        processingTime 
      });
      this.emit('task:completed', task);
    });

    this.queue.on(QueueEvent.TASK_FAILED, (task: AudioTask) => {
      this.logger.error('Task failed', task.error, { 
        taskId: task.id, 
        correlationId: task.correlationId 
      });
      this.emit('task:failed', task);
    });

    this.queue.on(QueueEvent.TASK_RETRYING, (task: AudioTask) => {
      this.logger.warn('Task retrying', { 
        taskId: task.id, 
        correlationId: task.correlationId,
        retryCount: task.retryCount 
      });
      this.emit('task:retrying', task);
    });
  }

  /**
   * タスクプロセッサーを登録
   */
  registerProcessor(name: string, processor: TaskProcessor): void {
    this.processors.set(name, processor);
    this.logger.info('Processor registered', { processorName: name });
  }

  /**
   * タスクをキューに追加
   */
  async submitTask(processorName: string, data: any, correlationId?: string): Promise<AudioTask> {
    if (!this.processors.has(processorName)) {
      throw new Error(`Processor '${processorName}' not found`);
    }

    const task = await this.queue.enqueue({ processorName, data }, correlationId);
    
    if (this.isRunning) {
      this.processNextTask();
    }

    return task;
  }

  /**
   * エンジンを開始
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.logger.info('Workflow engine started');

    // ヘルスチェックを開始
    this.startHealthCheck();

    // 初期ワーカーを起動
    for (let i = 0; i < this.config.concurrency; i++) {
      this.processNextTask();
    }
  }

  /**
   * エンジンを停止
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // すべてのワーカーが完了するまで待機
    while (this.activeWorkers > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.logger.info('Workflow engine stopped');
  }

  /**
   * 次のタスクを処理
   */
  private async processNextTask(): Promise<void> {
    if (!this.isRunning || this.activeWorkers >= this.config.concurrency) {
      return;
    }

    const task = await this.queue.dequeue();
    if (!task) {
      return;
    }

    this.activeWorkers++;

    try {
      const taskLogger = new CorrelatedLogger(this.logger, task.correlationId);
      taskLogger.info('Processing task', { taskId: task.id });

      const { processorName, data } = task.data;
      const processor = this.processors.get(processorName);
      
      if (!processor) {
        throw new Error(`Processor '${processorName}' not found`);
      }

      const result = await processor.process(data);
      await this.queue.markCompleted(task.id, result);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      await this.handleTaskError(task, err);
    } finally {
      this.activeWorkers--;
      
      if (this.isRunning) {
        // 次のタスクを処理
        setImmediate(() => this.processNextTask());
      }
    }
  }

  /**
   * タスクエラーを処理
   */
  private async handleTaskError(task: AudioTask, error: Error): Promise<void> {
    const taskLogger = new CorrelatedLogger(this.logger, task.correlationId);
    taskLogger.error('Task processing failed', error, { taskId: task.id });

    if (task.retryCount < this.config.maxRetries) {
      // リトライ遅延
      await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
      await this.queue.retry(task.id);
    } else {
      await this.queue.markFailed(task.id, error);
    }
  }

  /**
   * ヘルスチェックを開始
   */
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(() => {
      const health = this.getHealthStatus();
      this.emit('health:check', health);
      
      if (health.status === 'unhealthy') {
        this.logger.error('Health check failed', undefined, { errors: health.errors });
      }
    }, this.config.healthCheckInterval);
  }

  /**
   * メトリクスを取得
   */
  getMetrics(): Metrics {
    const stats = this.queue.getStats();
    const avgProcessingTime = this.processingTimes.length > 0
      ? this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length
      : 0;
    
    const uptime = new Date().getTime() - this.startTime.getTime();
    const throughput = stats.completed / (uptime / 1000 / 60); // タスク/分

    return {
      totalTasks: stats.total,
      pendingTasks: stats.pending,
      processingTasks: stats.processing,
      completedTasks: stats.completed,
      failedTasks: stats.failed,
      averageProcessingTime: avgProcessingTime,
      throughput: throughput
    };
  }

  /**
   * ヘルスステータスを取得
   */
  getHealthStatus(): HealthCheckResult {
    const metrics = this.getMetrics();
    const errors: string[] = [];

    // ヘルスチェック条件
    if (!this.isRunning) {
      errors.push('Engine is not running');
    }

    if (metrics.pendingTasks > 100) {
      errors.push('Too many pending tasks');
    }

    if (metrics.failedTasks / metrics.totalTasks > 0.1 && metrics.totalTasks > 10) {
      errors.push('High failure rate');
    }

    const processingTasks = this.queue.getProcessingTasks();
    const now = new Date().getTime();
    const stuckTasks = processingTasks.filter(task => {
      const processingTime = now - task.startedAt!.getTime();
      return processingTime > 300000; // 5分以上
    });

    if (stuckTasks.length > 0) {
      errors.push(`${stuckTasks.length} tasks appear to be stuck`);
    }

    return {
      status: errors.length === 0 ? 'healthy' : 'unhealthy',
      metrics,
      errors,
      lastCheck: new Date()
    };
  }

  /**
   * タスクのステータスを取得
   */
  getTaskStatus(taskId: string): AudioTask | undefined {
    return this.queue.getTask(taskId);
  }
}