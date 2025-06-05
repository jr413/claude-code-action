/**
 * キューのユニットテスト
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { InMemoryQueue } from '../../src/audio-workflow/queue';
import { TaskStatus, QueueEvent } from '../../src/audio-workflow/types';

describe('InMemoryQueue', () => {
  let queue: InMemoryQueue;

  beforeEach(() => {
    queue = new InMemoryQueue();
  });

  describe('enqueue', () => {
    it('タスクをキューに追加できる', async () => {
      const task = await queue.enqueue({ test: 'data' });
      
      expect(task.id).toBeDefined();
      expect(task.correlationId).toBeDefined();
      expect(task.status).toBe(TaskStatus.PENDING);
      expect(task.data).toEqual({ test: 'data' });
      expect(task.retryCount).toBe(0);
      expect(task.maxRetries).toBe(3);
    });

    it('カスタム相関IDを使用できる', async () => {
      const correlationId = 'custom-correlation-id';
      const task = await queue.enqueue({ test: 'data' }, correlationId);
      
      expect(task.correlationId).toBe(correlationId);
    });

    it('TASK_ADDEDイベントを発行する', async () => {
      let emittedTask: any;
      queue.once(QueueEvent.TASK_ADDED, (task) => {
        emittedTask = task;
      });

      const task = await queue.enqueue({ test: 'data' });
      
      expect(emittedTask).toBeDefined();
      expect(emittedTask.id).toBe(task.id);
    });
  });

  describe('dequeue', () => {
    it('次のタスクを取得できる', async () => {
      const task1 = await queue.enqueue({ order: 1 });
      const task2 = await queue.enqueue({ order: 2 });

      const dequeued = await queue.dequeue();
      
      expect(dequeued?.id).toBe(task1.id);
      expect(dequeued?.status).toBe(TaskStatus.PROCESSING);
      expect(dequeued?.startedAt).toBeDefined();
    });

    it('空のキューからnullを返す', async () => {
      const result = await queue.dequeue();
      expect(result).toBeNull();
    });

    it('TASK_STARTEDイベントを発行する', async () => {
      await queue.enqueue({ test: 'data' });
      
      let emittedTask: any;
      queue.once(QueueEvent.TASK_STARTED, (task) => {
        emittedTask = task;
      });

      const dequeued = await queue.dequeue();
      
      expect(emittedTask).toBeDefined();
      expect(emittedTask.status).toBe(TaskStatus.PROCESSING);
    });
  });

  describe('markCompleted', () => {
    it('タスクを完了状態に更新できる', async () => {
      const task = await queue.enqueue({ test: 'data' });
      await queue.dequeue();

      await queue.markCompleted(task.id, { result: 'success' });
      
      const updated = queue.getTask(task.id);
      expect(updated?.status).toBe(TaskStatus.COMPLETED);
      expect(updated?.result).toEqual({ result: 'success' });
      expect(updated?.completedAt).toBeDefined();
    });

    it('存在しないタスクIDでエラーを投げる', async () => {
      await expect(queue.markCompleted('invalid-id', {})).rejects.toThrow('Task invalid-id not found');
    });

    it('TASK_COMPLETEDイベントを発行する', async () => {
      const task = await queue.enqueue({ test: 'data' });
      await queue.dequeue();

      let emittedTask: any;
      queue.once(QueueEvent.TASK_COMPLETED, (t) => {
        emittedTask = t;
      });

      await queue.markCompleted(task.id, { result: 'success' });
      
      expect(emittedTask).toBeDefined();
      expect(emittedTask.status).toBe(TaskStatus.COMPLETED);
    });
  });

  describe('markFailed', () => {
    it('タスクを失敗状態に更新できる', async () => {
      const task = await queue.enqueue({ test: 'data' });
      await queue.dequeue();

      const error = new Error('Test error');
      await queue.markFailed(task.id, error);
      
      const updated = queue.getTask(task.id);
      expect(updated?.status).toBe(TaskStatus.FAILED);
      expect(updated?.error).toBe(error);
      expect(updated?.completedAt).toBeDefined();
    });

    it('TASK_FAILEDイベントを発行する', async () => {
      const task = await queue.enqueue({ test: 'data' });
      await queue.dequeue();

      let emittedTask: any;
      queue.once(QueueEvent.TASK_FAILED, (t) => {
        emittedTask = t;
      });

      await queue.markFailed(task.id, new Error('Test error'));
      
      expect(emittedTask).toBeDefined();
      expect(emittedTask.status).toBe(TaskStatus.FAILED);
    });
  });

  describe('retry', () => {
    it('タスクをリトライキューに戻せる', async () => {
      const task = await queue.enqueue({ test: 'data' });
      await queue.dequeue();

      await queue.retry(task.id);
      
      const updated = queue.getTask(task.id);
      expect(updated?.status).toBe(TaskStatus.PENDING);
      expect(updated?.retryCount).toBe(1);
      expect(updated?.startedAt).toBeUndefined();

      // 再度dequeueできることを確認
      const dequeued = await queue.dequeue();
      expect(dequeued?.id).toBe(task.id);
    });

    it('最大リトライ回数を超えた場合は失敗状態にする', async () => {
      const task = await queue.enqueue({ test: 'data' });
      task.retryCount = 3; // maxRetriesと同じ
      await queue.dequeue();

      await queue.retry(task.id);
      
      const updated = queue.getTask(task.id);
      expect(updated?.status).toBe(TaskStatus.FAILED);
      expect(updated?.error?.message).toBe('Max retries exceeded');
    });

    it('TASK_RETRYINGイベントを発行する', async () => {
      const task = await queue.enqueue({ test: 'data' });
      await queue.dequeue();

      let emittedTask: any;
      queue.once(QueueEvent.TASK_RETRYING, (t) => {
        emittedTask = t;
      });

      await queue.retry(task.id);
      
      expect(emittedTask).toBeDefined();
      expect(emittedTask.retryCount).toBe(1);
    });
  });

  describe('getStats', () => {
    it('正確な統計情報を返す', async () => {
      // タスクを追加
      const task1 = await queue.enqueue({ order: 1 });
      const task2 = await queue.enqueue({ order: 2 });
      const task3 = await queue.enqueue({ order: 3 });

      // 1つを処理中に
      await queue.dequeue();

      // 1つを完了に
      await queue.markCompleted(task1.id, {});

      // 1つを失敗に
      await queue.dequeue();
      await queue.markFailed(task2.id, new Error('Failed'));

      const stats = queue.getStats();
      
      expect(stats.total).toBe(3);
      expect(stats.pending).toBe(1);
      expect(stats.processing).toBe(0);
      expect(stats.completed).toBe(1);
      expect(stats.failed).toBe(1);
    });
  });

  describe('getProcessingTasks', () => {
    it('処理中のタスクのみを返す', async () => {
      await queue.enqueue({ order: 1 });
      await queue.enqueue({ order: 2 });
      await queue.enqueue({ order: 3 });

      const task1 = await queue.dequeue();
      const task2 = await queue.dequeue();

      const processingTasks = queue.getProcessingTasks();
      
      expect(processingTasks.length).toBe(2);
      expect(processingTasks.map(t => t.id)).toContain(task1!.id);
      expect(processingTasks.map(t => t.id)).toContain(task2!.id);
    });
  });

  describe('clear', () => {
    it('キューを完全にクリアできる', async () => {
      await queue.enqueue({ order: 1 });
      await queue.enqueue({ order: 2 });
      await queue.dequeue();

      queue.clear();

      const stats = queue.getStats();
      expect(stats.total).toBe(0);
      expect(stats.pending).toBe(0);
      expect(stats.processing).toBe(0);
    });
  });
});