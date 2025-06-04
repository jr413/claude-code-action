import { AudioJob, JobStatus, QueueOptions, JobProcessor } from './types';
import { StructuredLogger } from './logger';

export class AudioQueue {
  private queue: AudioJob[] = [];
  private processing: Map<string, AudioJob> = new Map();
  private completed: Map<string, AudioJob> = new Map();
  private failed: Map<string, AudioJob> = new Map();
  private options: QueueOptions;
  private processor?: JobProcessor;
  private logger: StructuredLogger;
  private startTime: Date;

  constructor(options: Partial<QueueOptions> = {}) {
    this.options = {
      maxConcurrency: options.maxConcurrency || 5,
      retryLimit: options.retryLimit || 3,
      retryDelay: options.retryDelay || 1000
    };
    this.logger = new StructuredLogger('AudioQueue');
    this.startTime = new Date();
  }

  generateId(): string {
    return `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateCorrelationId(): string {
    return `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  enqueue(data: any): AudioJob {
    const job: AudioJob = {
      id: this.generateId(),
      data,
      status: JobStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      correlationId: this.generateCorrelationId(),
      retryCount: 0
    };

    this.queue.push(job);
    this.logger.info('Job enqueued', { jobId: job.id, correlationId: job.correlationId });
    
    this.processNext();
    return job;
  }

  setProcessor(processor: JobProcessor): void {
    this.processor = processor;
    this.processNext();
  }

  private async processNext(): Promise<void> {
    if (!this.processor) return;
    if (this.processing.size >= this.options.maxConcurrency) return;
    if (this.queue.length === 0) return;

    const job = this.queue.shift();
    if (!job) return;

    job.status = JobStatus.PROCESSING;
    job.updatedAt = new Date();
    this.processing.set(job.id, job);

    this.logger.info('Job processing started', { 
      jobId: job.id, 
      correlationId: job.correlationId,
      retryCount: job.retryCount 
    });

    try {
      const result = await this.processor(job);
      job.status = JobStatus.COMPLETED;
      job.updatedAt = new Date();
      this.processing.delete(job.id);
      this.completed.set(job.id, job);

      this.logger.info('Job completed successfully', { 
        jobId: job.id, 
        correlationId: job.correlationId,
        processingTime: job.updatedAt.getTime() - job.createdAt.getTime()
      });

      this.processNext();
    } catch (error: any) {
      job.error = error.message;
      job.updatedAt = new Date();
      this.processing.delete(job.id);

      if (job.retryCount < this.options.retryLimit) {
        job.retryCount++;
        job.status = JobStatus.PENDING;
        
        this.logger.warn('Job failed, retrying', { 
          jobId: job.id, 
          correlationId: job.correlationId,
          error: error.message,
          retryCount: job.retryCount
        });

        setTimeout(() => {
          this.queue.push(job);
          this.processNext();
        }, this.options.retryDelay * job.retryCount);
      } else {
        job.status = JobStatus.FAILED;
        this.failed.set(job.id, job);
        
        this.logger.error('Job failed permanently', { 
          jobId: job.id, 
          correlationId: job.correlationId,
          error: error.message,
          retryCount: job.retryCount
        });

        this.processNext();
      }
    }
  }

  getJob(id: string): AudioJob | undefined {
    return this.processing.get(id) || 
           this.completed.get(id) || 
           this.failed.get(id) ||
           this.queue.find(job => job.id === id);
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  getActiveCount(): number {
    return this.processing.size;
  }

  getCompletedCount(): number {
    return this.completed.size;
  }

  getFailedCount(): number {
    return this.failed.size;
  }

  getUptime(): number {
    return Date.now() - this.startTime.getTime();
  }

  clearCompleted(): void {
    const count = this.completed.size;
    this.completed.clear();
    this.logger.info('Cleared completed jobs', { count });
  }

  clearFailed(): void {
    const count = this.failed.size;
    this.failed.clear();
    this.logger.info('Cleared failed jobs', { count });
  }
}