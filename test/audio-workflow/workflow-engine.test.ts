/**
 * ワークフローエンジンのユニットテスト
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { AudioWorkflowEngine } from '../../src/audio-workflow/workflow-engine';
import { TaskProcessor, TaskStatus } from '../../src/audio-workflow/types';

// モックプロセッサー
class MockProcessor implements TaskProcessor<any, any> {
  processDelay: number;
  shouldFail: boolean;
  processedCount: number = 0;

  constructor(processDelay: number = 10, shouldFail: boolean = false) {
    this.processDelay = processDelay;
    this.shouldFail = shouldFail;
  }

  async process(data: any): Promise<any> {
    this.processedCount++;
    await new Promise(resolve => setTimeout(resolve, this.processDelay));
    
    if (this.shouldFail) {
      throw new Error('Mock processor failed');
    }
    
    return { processed: data, timestamp: new Date() };
  }
}

describe('AudioWorkflowEngine', () => {
  let engine: AudioWorkflowEngine;

  beforeEach(() => {
    engine = new AudioWorkflowEngine({
      concurrency: 2,
      maxRetries: 2,
      retryDelay: 10,
      healthCheckInterval: 1000
    });
  });

  afterEach(async () => {
    await engine.stop();
  });

  describe('registerProcessor', () => {
    it('プロセッサーを登録できる', () => {
      const processor = new MockProcessor();
      engine.registerProcessor('test-processor', processor);
      
      // エラーが発生しなければ成功
      expect(true).toBe(true);
    });
  });

  describe('submitTask', () => {
    it('タスクを送信できる', async () => {
      const processor = new MockProcessor();
      engine.registerProcessor('test-processor', processor);

      const task = await engine.submitTask('test-processor', { value: 123 });
      
      expect(task.id).toBeDefined();
      expect(task.data).toEqual({
        processorName: 'test-processor',
        data: { value: 123 }
      });
    });

    it('登録されていないプロセッサーでエラーを投げる', async () => {
      await expect(
        engine.submitTask('unknown-processor', {})
      ).rejects.toThrow("Processor 'unknown-processor' not found");
    });

    it('カスタム相関IDを使用できる', async () => {
      const processor = new MockProcessor();
      engine.registerProcessor('test-processor', processor);

      const correlationId = 'custom-id-123';
      const task = await engine.submitTask('test-processor', {}, correlationId);
      
      expect(task.correlationId).toBe(correlationId);
    });
  });

  describe('start/stop', () => {
    it('エンジンを開始・停止できる', async () => {
      const processor = new MockProcessor();
      engine.registerProcessor('test-processor', processor);

      engine.start();
      
      // タスクを送信
      await engine.submitTask('test-processor', { test: 'data' });
      
      // 処理が完了するまで待機
      await new Promise(resolve => setTimeout(resolve, 50));
      
      await engine.stop();
      
      expect(processor.processedCount).toBe(1);
    });

    it('複数回startを呼んでも問題ない', () => {
      engine.start();
      engine.start(); // 2回目
      
      // エラーが発生しなければ成功
      expect(true).toBe(true);
    });
  });

  describe('並行処理', () => {
    it('設定された並行数でタスクを処理する', async () => {
      const processor = new MockProcessor(20); // 20ms の処理時間
      engine.registerProcessor('test-processor', processor);
      engine.start();

      const startTime = Date.now();
      
      // 4つのタスクを送信（並行数は2）
      const tasks = await Promise.all([
        engine.submitTask('test-processor', { id: 1 }),
        engine.submitTask('test-processor', { id: 2 }),
        engine.submitTask('test-processor', { id: 3 }),
        engine.submitTask('test-processor', { id: 4 })
      ]);

      // すべてのタスクが完了するまで待機
      await new Promise(resolve => setTimeout(resolve, 100));

      const elapsedTime = Date.now() - startTime;
      
      // 並行数2で4タスク（各20ms）なので、約40ms以上かかるはず
      expect(elapsedTime).toBeGreaterThanOrEqual(40);
      expect(processor.processedCount).toBe(4);
    });
  });

  describe('エラー処理とリトライ', () => {
    it('失敗したタスクをリトライする', async () => {
      let attemptCount = 0;
      const processor = {
        async process(data: any) {
          attemptCount++;
          if (attemptCount < 3) {
            throw new Error('Temporary failure');
          }
          return { success: true };
        }
      };

      engine.registerProcessor('retry-test', processor);
      engine.start();

      const task = await engine.submitTask('retry-test', { test: 'data' });
      
      // リトライを含めて完了するまで待機
      await new Promise(resolve => setTimeout(resolve, 100));

      const finalTask = engine.getTaskStatus(task.id);
      expect(finalTask?.status).toBe(TaskStatus.COMPLETED);
      expect(attemptCount).toBe(3); // 初回 + 2回のリトライ
    });

    it('最大リトライ回数を超えたら失敗とする', async () => {
      const processor = new MockProcessor(10, true); // 常に失敗
      engine.registerProcessor('fail-test', processor);
      engine.start();

      const task = await engine.submitTask('fail-test', { test: 'data' });
      
      // リトライを含めて完了するまで待機
      await new Promise(resolve => setTimeout(resolve, 100));

      const finalTask = engine.getTaskStatus(task.id);
      expect(finalTask?.status).toBe(TaskStatus.FAILED);
      expect(finalTask?.error?.message).toBe('Mock processor failed');
      expect(processor.processedCount).toBe(3); // 初回 + 2回のリトライ
    });
  });

  describe('イベント', () => {
    it('タスク完了イベントを発行する', async () => {
      const processor = new MockProcessor();
      engine.registerProcessor('test-processor', processor);
      engine.start();

      let completedTask: any;
      engine.once('task:completed', (task) => {
        completedTask = task;
      });

      const task = await engine.submitTask('test-processor', { value: 'test' });
      
      // 完了まで待機
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(completedTask).toBeDefined();
      expect(completedTask.id).toBe(task.id);
      expect(completedTask.result).toEqual({
        processed: { value: 'test' },
        timestamp: expect.any(Date)
      });
    });

    it('タスク失敗イベントを発行する', async () => {
      const processor = new MockProcessor(10, true);
      engine.registerProcessor('fail-processor', processor);
      engine.start();

      let failedTask: any;
      engine.once('task:failed', (task) => {
        failedTask = task;
      });

      await engine.submitTask('fail-processor', { value: 'test' });
      
      // 失敗まで待機（リトライ含む）
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(failedTask).toBeDefined();
      expect(failedTask.error?.message).toBe('Mock processor failed');
    });
  });

  describe('メトリクス', () => {
    it('正確なメトリクスを提供する', async () => {
      const processor = new MockProcessor(10);
      const failProcessor = new MockProcessor(10, true);
      
      engine.registerProcessor('success-processor', processor);
      engine.registerProcessor('fail-processor', failProcessor);
      engine.start();

      // 成功するタスクを3つ
      await Promise.all([
        engine.submitTask('success-processor', { id: 1 }),
        engine.submitTask('success-processor', { id: 2 }),
        engine.submitTask('success-processor', { id: 3 })
      ]);

      // 失敗するタスクを1つ
      await engine.submitTask('fail-processor', { id: 4 });

      // 処理完了まで待機
      await new Promise(resolve => setTimeout(resolve, 150));

      const metrics = engine.getMetrics();
      
      expect(metrics.totalTasks).toBe(4);
      expect(metrics.completedTasks).toBe(3);
      expect(metrics.failedTasks).toBe(1);
      expect(metrics.pendingTasks).toBe(0);
      expect(metrics.processingTasks).toBe(0);
      expect(metrics.averageProcessingTime).toBeGreaterThan(0);
      expect(metrics.throughput).toBeGreaterThan(0);
    });
  });

  describe('ヘルスチェック', () => {
    it('健全な状態を報告する', async () => {
      const processor = new MockProcessor();
      engine.registerProcessor('test-processor', processor);
      engine.start();

      await engine.submitTask('test-processor', { test: 'data' });
      await new Promise(resolve => setTimeout(resolve, 50));

      const health = engine.getHealthStatus();
      
      expect(health.status).toBe('healthy');
      expect(health.errors).toEqual([]);
      expect(health.metrics.completedTasks).toBe(1);
    });

    it('停止中は不健全と報告する', () => {
      const health = engine.getHealthStatus();
      
      expect(health.status).toBe('unhealthy');
      expect(health.errors).toContain('Engine is not running');
    });

    it('高い失敗率で不健全と報告する', async () => {
      const processor = new MockProcessor(5, true);
      engine.registerProcessor('fail-processor', processor);
      engine.start();

      // 11個のタスクを送信（すべて失敗）
      for (let i = 0; i < 11; i++) {
        await engine.submitTask('fail-processor', { id: i });
      }

      // 処理完了まで待機
      await new Promise(resolve => setTimeout(resolve, 200));

      const health = engine.getHealthStatus();
      
      expect(health.status).toBe('unhealthy');
      expect(health.errors).toContain('High failure rate');
    });
  });
});