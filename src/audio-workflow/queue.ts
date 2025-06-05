import { EventEmitter } from 'events';
import type { QueueItem, ProcessingState, QueueConfig, JobProcessor, QueueEvents } from './types';

export class Queue<T = any> extends EventEmitter {
  private items: Map<string, QueueItem<T>> = new Map();
  private processingItems: Set<string> = new Set();
  private readonly config: QueueConfig;
  private processor?: JobProcessor<T>;
  private isRunning = false;
  private correlationCounter = 0;

  constructor(config: Partial<QueueConfig> = {}) {
    super();
    this.config = {
      maxConcurrency: config.maxConcurrency ?? 3,
      defaultMaxRetries: config.defaultMaxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      healthCheckInterval: config.healthCheckInterval ?? 30000,
    };
  }

  setProcessor(processor: JobProcessor<T>): void {
    this.processor = processor;
  }

  async add(data: T, options: { priority?: number; maxRetries?: number } = {}): Promise<QueueItem<T>> {
    const id = this.generateCorrelationId();
    const job: QueueItem<T> = {
      id,
      data,
      state: 'pending',
      priority: options.priority ?? 0,
      retryCount: 0,
      maxRetries: options.maxRetries ?? this.config.defaultMaxRetries,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.items.set(id, job);
    this.emit('jobAdded', job);
    
    if (this.isRunning) {
      this.processNext();
    }

    return job;
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.processPendingJobs();
  }

  stop(): void {
    this.isRunning = false;
  }

  getJob(id: string): QueueItem<T> | undefined {
    return this.items.get(id);
  }

  getAllJobs(): QueueItem<T>[] {
    return Array.from(this.items.values());
  }

  getJobsByState(state: ProcessingState): QueueItem<T>[] {
    return Array.from(this.items.values()).filter(job => job.state === state);
  }

  clearCompleted(): void {
    for (const [id, job] of this.items.entries()) {
      if (job.state === 'completed') {
        this.items.delete(id);
      }
    }
  }

  private generateCorrelationId(): string {
    const timestamp = Date.now().toString(36);
    const counter = (++this.correlationCounter).toString(36).padStart(4, '0');
    const random = Math.random().toString(36).substring(2, 6);
    return `job-${timestamp}-${counter}-${random}`;
  }

  private async processPendingJobs(): Promise<void> {
    while (this.isRunning) {
      await this.processNext();
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private async processNext(): Promise<void> {
    if (this.processingItems.size >= this.config.maxConcurrency) {
      return;
    }

    const pendingJobs = this.getJobsByState('pending')
      .sort((a, b) => b.priority - a.priority || a.createdAt.getTime() - b.createdAt.getTime());

    const job = pendingJobs[0];
    if (!job || !this.processor) return;

    this.processingItems.add(job.id);
    job.state = 'processing';
    job.updatedAt = new Date();
    this.emit('jobStarted', job);

    try {
      const result = await this.processor(job);
      job.result = result;
      job.state = 'completed';
      job.updatedAt = new Date();
      this.emit('jobCompleted', job);
    } catch (error) {
      job.error = error as Error;
      job.updatedAt = new Date();
      
      if (job.retryCount < job.maxRetries) {
        job.retryCount++;
        job.state = 'pending';
        this.emit('jobRetrying', job, job.retryCount);
        
        setTimeout(() => {
          if (this.isRunning) {
            this.processNext();
          }
        }, this.config.retryDelay * job.retryCount);
      } else {
        job.state = 'failed';
        this.emit('jobFailed', job, error as Error);
      }
    } finally {
      this.processingItems.delete(job.id);
    }
  }

  getMetrics(): {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  } {
    const jobs = this.getAllJobs();
    return {
      pending: jobs.filter(j => j.state === 'pending').length,
      processing: jobs.filter(j => j.state === 'processing').length,
      completed: jobs.filter(j => j.state === 'completed').length,
      failed: jobs.filter(j => j.state === 'failed').length,
      total: jobs.length,
    };
  }

  on<K extends keyof QueueEvents>(event: K, listener: QueueEvents[K]): this {
    return super.on(event, listener as any);
  }

  emit<K extends keyof QueueEvents>(event: K, ...args: Parameters<QueueEvents[K]>): boolean {
    return super.emit(event, ...args);
  }
}