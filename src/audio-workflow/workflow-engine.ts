import { AudioQueue } from './queue';
import { WorkerPool } from './worker-pool';
import { MonitoringService } from './monitoring';
import { StructuredLogger } from './logger';
import { JobProcessor, QueueOptions, WorkerOptions, HealthStatus, Metrics, AudioJob } from './types';

export interface WorkflowEngineOptions {
  queueOptions?: Partial<QueueOptions>;
  workers?: WorkerOptions[];
}

export class AudioWorkflowEngine {
  private queue: AudioQueue;
  private workerPool: WorkerPool;
  private monitoring: MonitoringService;
  private logger: StructuredLogger;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(options: WorkflowEngineOptions = {}) {
    this.queue = new AudioQueue(options.queueOptions);
    this.workerPool = new WorkerPool(this.queue);
    this.monitoring = new MonitoringService(this.queue, this.workerPool);
    this.logger = new StructuredLogger('AudioWorkflowEngine');

    if (options.workers) {
      options.workers.forEach(workerOptions => {
        this.addWorker(workerOptions);
      });
    }

    this.logger.info('Audio workflow engine initialized', { 
      queueOptions: options.queueOptions,
      workerCount: options.workers?.length || 0
    });
  }

  setProcessor(processor: JobProcessor): void {
    this.queue.setProcessor(processor);
    this.logger.info('Job processor set');
  }

  addWorker(options: WorkerOptions): void {
    const processor: JobProcessor = async (job: AudioJob) => {
      const startTime = Date.now();
      try {
        const result = await this.processAudioJob(job);
        const processingTime = Date.now() - startTime;
        this.monitoring.recordProcessingTime(processingTime);
        return result;
      } catch (error) {
        throw error;
      }
    };

    const worker = this.workerPool.createWorker(options, processor);
    worker.start();
  }

  private async processAudioJob(job: AudioJob): Promise<any> {
    this.logger.info('Processing audio job', { 
      jobId: job.id, 
      correlationId: job.correlationId 
    });

    // シミュレートされた音声処理
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.9) {
          reject(new Error('Audio processing failed'));
        } else {
          resolve({ 
            jobId: job.id, 
            result: 'Audio processed successfully',
            processingTime: Date.now() - job.createdAt.getTime()
          });
        }
      }, Math.random() * 2000 + 500);
    });
  }

  enqueueJob(data: any): AudioJob {
    return this.queue.enqueue(data);
  }

  getJob(id: string): AudioJob | undefined {
    return this.queue.getJob(id);
  }

  getHealthStatus(): HealthStatus {
    return this.monitoring.getHealthStatus();
  }

  getMetrics(): Metrics {
    return this.monitoring.getMetrics();
  }

  startHealthMonitoring(intervalMs: number = 60000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.healthCheckInterval = this.monitoring.startPeriodicHealthCheck(intervalMs);
  }

  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
      this.logger.info('Health monitoring stopped');
    }
  }

  shutdown(): void {
    this.stopHealthMonitoring();
    this.workerPool.stopAll();
    this.logger.info('Audio workflow engine shut down');
  }

  // 便利なメソッド
  getQueueStats() {
    return {
      pending: this.queue.getQueueSize(),
      processing: this.queue.getActiveCount(),
      completed: this.queue.getCompletedCount(),
      failed: this.queue.getFailedCount()
    };
  }

  clearHistory(): void {
    this.queue.clearCompleted();
    this.queue.clearFailed();
    this.logger.info('Job history cleared');
  }
}