import { WorkerOptions, JobProcessor, AudioJob } from './types';
import { StructuredLogger } from './logger';
import { AudioQueue } from './queue';

export class WorkerPool {
  private workers: Map<string, Worker> = new Map();
  private queue: AudioQueue;
  private logger: StructuredLogger;

  constructor(queue: AudioQueue) {
    this.queue = queue;
    this.logger = new StructuredLogger('WorkerPool');
  }

  createWorker(options: WorkerOptions, processor: JobProcessor): Worker {
    const worker = new Worker(options.id, options.concurrency, processor, this.logger);
    this.workers.set(options.id, worker);
    
    this.logger.info('Worker created', { workerId: options.id, concurrency: options.concurrency });
    return worker;
  }

  removeWorker(id: string): void {
    const worker = this.workers.get(id);
    if (worker) {
      worker.stop();
      this.workers.delete(id);
      this.logger.info('Worker removed', { workerId: id });
    }
  }

  getActiveWorkerCount(): number {
    return Array.from(this.workers.values()).filter(w => w.isActive()).length;
  }

  getAllWorkers(): Worker[] {
    return Array.from(this.workers.values());
  }

  stopAll(): void {
    this.workers.forEach(worker => worker.stop());
    this.workers.clear();
    this.logger.info('All workers stopped');
  }
}

export class Worker {
  private id: string;
  private concurrency: number;
  private processor: JobProcessor;
  private active: boolean = false;
  private processing: number = 0;
  private logger: StructuredLogger;

  constructor(id: string, concurrency: number, processor: JobProcessor, logger: StructuredLogger) {
    this.id = id;
    this.concurrency = concurrency;
    this.processor = processor;
    this.logger = logger;
  }

  start(): void {
    this.active = true;
    this.logger.info('Worker started', { workerId: this.id });
  }

  stop(): void {
    this.active = false;
    this.logger.info('Worker stopped', { workerId: this.id });
  }

  isActive(): boolean {
    return this.active;
  }

  getProcessingCount(): number {
    return this.processing;
  }

  canProcess(): boolean {
    return this.active && this.processing < this.concurrency;
  }

  async process(job: AudioJob): Promise<any> {
    if (!this.canProcess()) {
      throw new Error('Worker cannot process more jobs');
    }

    this.processing++;
    this.logger.debug('Worker processing job', { 
      workerId: this.id, 
      jobId: job.id,
      processing: this.processing 
    });

    try {
      const result = await this.processor(job);
      this.processing--;
      return result;
    } catch (error) {
      this.processing--;
      throw error;
    }
  }
}