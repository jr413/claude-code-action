import { Queue } from './queue';
import { StructuredLogger } from './logger';
import type { 
  AudioProcessingJob, 
  WorkflowMetrics, 
  QueueItem, 
  Logger,
  ProcessingOptions 
} from './types';

export class AudioWorkflowEngine {
  private queue: Queue<AudioProcessingJob>;
  private logger: Logger;
  private healthCheckInterval?: NodeJS.Timer;
  private startTime: Date;
  private completedJobsProcessingTime: number[] = [];

  constructor(
    private config: {
      maxConcurrency?: number;
      defaultMaxRetries?: number;
      retryDelay?: number;
      healthCheckInterval?: number;
    } = {}
  ) {
    this.logger = new StructuredLogger('audio-workflow-engine');
    this.queue = new Queue<AudioProcessingJob>({
      maxConcurrency: config.maxConcurrency ?? 3,
      defaultMaxRetries: config.defaultMaxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      healthCheckInterval: config.healthCheckInterval ?? 30000,
    });
    this.startTime = new Date();
    
    this.setupEventHandlers();
    this.queue.setProcessor(this.processAudioJob.bind(this));
  }

  private setupEventHandlers(): void {
    this.queue.on('jobAdded', (job) => {
      this.logger.info('Job added to queue', { 
        jobId: job.id, 
        fileName: job.data.fileName 
      });
    });

    this.queue.on('jobStarted', (job) => {
      (this.logger as StructuredLogger).setCorrelationId(job.id);
      this.logger.info('Job processing started', { 
        jobId: job.id, 
        fileName: job.data.fileName,
        attempt: job.retryCount + 1
      });
    });

    this.queue.on('jobCompleted', (job) => {
      const processingTime = job.updatedAt.getTime() - job.createdAt.getTime();
      this.completedJobsProcessingTime.push(processingTime);
      
      this.logger.info('Job completed successfully', { 
        jobId: job.id, 
        fileName: job.data.fileName,
        processingTime: `${processingTime}ms`
      });
    });

    this.queue.on('jobFailed', (job, error) => {
      this.logger.error('Job failed permanently', error, { 
        jobId: job.id, 
        fileName: job.data.fileName,
        attempts: job.retryCount + 1
      });
    });

    this.queue.on('jobRetrying', (job, attempt) => {
      this.logger.warn('Job failed, retrying', { 
        jobId: job.id, 
        fileName: job.data.fileName,
        attempt,
        maxAttempts: job.maxRetries
      });
    });
  }

  async start(): Promise<void> {
    this.logger.info('Starting Audio Workflow Engine', { 
      config: this.config 
    });
    
    this.queue.start();
    this.startHealthCheck();
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping Audio Workflow Engine');
    
    this.queue.stop();
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }

  async addJob(
    job: AudioProcessingJob, 
    options?: { priority?: number; maxRetries?: number }
  ): Promise<QueueItem<AudioProcessingJob>> {
    this.logger.info('Adding new audio processing job', {
      fileName: job.fileName,
      format: job.format,
      fileSize: job.fileSize,
      options: job.processingOptions
    });

    return this.queue.add(job, options);
  }

  private async processAudioJob(job: QueueItem<AudioProcessingJob>): Promise<any> {
    const { data } = job;
    
    this.logger.info('Processing audio file', {
      jobId: job.id,
      fileName: data.fileName,
      format: data.format,
      options: data.processingOptions
    });

    // Simulate audio processing with various operations
    const steps: Array<{ name: string; duration: number }> = [];

    if (data.processingOptions.normalize) {
      await this.simulateProcessingStep('Normalizing audio levels', 500, 800);
      steps.push({ name: 'normalize', duration: 650 });
    }

    if (data.processingOptions.removeNoise) {
      await this.simulateProcessingStep('Removing background noise', 800, 1200);
      steps.push({ name: 'noise_reduction', duration: 1000 });
    }

    if (data.processingOptions.convertFormat) {
      await this.simulateProcessingStep('Converting audio format', 1000, 1500);
      steps.push({ name: 'format_conversion', duration: 1250 });
    }

    // Simulate occasional failures for testing
    if (Math.random() < 0.1) {
      throw new Error(`Failed to process audio file: ${data.fileName}`);
    }

    const result = {
      processedFileId: `processed-${data.fileId}`,
      originalFile: data.fileName,
      outputFormat: data.processingOptions.convertFormat || data.format,
      processingSteps: steps,
      totalDuration: steps.reduce((sum, step) => sum + step.duration, 0),
    };

    this.logger.info('Audio processing completed', {
      jobId: job.id,
      result
    });

    return result;
  }

  private async simulateProcessingStep(
    stepName: string, 
    minDelay: number, 
    maxDelay: number
  ): Promise<void> {
    const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
    this.logger.debug(`Executing: ${stepName}`, { estimatedTime: `${delay}ms` });
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private startHealthCheck(): void {
    const interval = this.config.healthCheckInterval ?? 30000;
    
    this.healthCheckInterval = setInterval(() => {
      const metrics = this.getMetrics();
      this.logger.info('Health check', { metrics });
    }, interval);
  }

  getMetrics(): WorkflowMetrics {
    const queueMetrics = this.queue.getMetrics();
    const avgProcessingTime = this.completedJobsProcessingTime.length > 0
      ? this.completedJobsProcessingTime.reduce((a, b) => a + b, 0) / this.completedJobsProcessingTime.length
      : 0;

    return {
      totalJobs: queueMetrics.total,
      completedJobs: queueMetrics.completed,
      failedJobs: queueMetrics.failed,
      activeJobs: queueMetrics.processing,
      averageProcessingTime: Math.round(avgProcessingTime),
      queueLength: queueMetrics.pending,
      lastHealthCheck: new Date(),
    };
  }

  getJob(jobId: string): QueueItem<AudioProcessingJob> | undefined {
    return this.queue.getJob(jobId);
  }

  getAllJobs(): QueueItem<AudioProcessingJob>[] {
    return this.queue.getAllJobs();
  }

  clearCompletedJobs(): void {
    this.queue.clearCompleted();
    this.logger.info('Cleared completed jobs from queue');
  }
}