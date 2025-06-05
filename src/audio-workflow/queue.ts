/**
 * インメモリキューの実装
 */

import { EventEmitter } from 'events';
import { AudioTask, TaskStatus, QueueEvent } from './types';
import { randomUUID } from 'crypto';

export class InMemoryQueue extends EventEmitter {
  private tasks: Map<string, AudioTask>;
  private pendingQueue: string[];
  private processingTasks: Set<string>;

  constructor() {
    super();
    this.tasks = new Map();
    this.pendingQueue = [];
    this.processingTasks = new Set();
  }

  /**
   * タスクをキューに追加
   */
  async enqueue(data: any, correlationId?: string): Promise<AudioTask> {
    const task: AudioTask = {
      id: randomUUID(),
      correlationId: correlationId || randomUUID(),
      status: TaskStatus.PENDING,
      data,
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: 3
    };

    this.tasks.set(task.id, task);
    this.pendingQueue.push(task.id);
    this.emit(QueueEvent.TASK_ADDED, task);

    return task;
  }

  /**
   * 次の処理待ちタスクを取得
   */
  async dequeue(): Promise<AudioTask | null> {
    const taskId = this.pendingQueue.shift();
    if (!taskId) return null;

    const task = this.tasks.get(taskId);
    if (!task) return null;

    task.status = TaskStatus.PROCESSING;
    task.startedAt = new Date();
    this.processingTasks.add(taskId);
    this.emit(QueueEvent.TASK_STARTED, task);

    return task;
  }

  /**
   * タスクを完了状態に更新
   */
  async markCompleted(taskId: string, result: any): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    task.status = TaskStatus.COMPLETED;
    task.result = result;
    task.completedAt = new Date();
    this.processingTasks.delete(taskId);
    this.emit(QueueEvent.TASK_COMPLETED, task);
  }

  /**
   * タスクを失敗状態に更新
   */
  async markFailed(taskId: string, error: Error): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    task.status = TaskStatus.FAILED;
    task.error = error;
    task.completedAt = new Date();
    this.processingTasks.delete(taskId);
    this.emit(QueueEvent.TASK_FAILED, task);
  }

  /**
   * タスクをリトライキューに戻す
   */
  async retry(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    if (task.retryCount >= task.maxRetries) {
      await this.markFailed(taskId, new Error('Max retries exceeded'));
      return;
    }

    task.retryCount++;
    task.status = TaskStatus.PENDING;
    delete task.startedAt;
    this.processingTasks.delete(taskId);
    this.pendingQueue.push(taskId);
    this.emit(QueueEvent.TASK_RETRYING, task);
  }

  /**
   * タスクを取得
   */
  getTask(taskId: string): AudioTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * キューの統計情報を取得
   */
  getStats() {
    const tasks = Array.from(this.tasks.values());
    return {
      total: tasks.length,
      pending: this.pendingQueue.length,
      processing: this.processingTasks.size,
      completed: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
      failed: tasks.filter(t => t.status === TaskStatus.FAILED).length
    };
  }

  /**
   * 処理中のタスクを取得
   */
  getProcessingTasks(): AudioTask[] {
    return Array.from(this.processingTasks)
      .map(id => this.tasks.get(id))
      .filter((task): task is AudioTask => task !== undefined);
  }

  /**
   * キューをクリア
   */
  clear(): void {
    this.tasks.clear();
    this.pendingQueue = [];
    this.processingTasks.clear();
  }
}