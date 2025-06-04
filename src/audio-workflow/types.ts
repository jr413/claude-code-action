export interface AudioJob {
  id: string;
  data: any;
  status: JobStatus;
  createdAt: Date;
  updatedAt: Date;
  correlationId: string;
  retryCount: number;
  error?: string;
}

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface QueueOptions {
  maxConcurrency: number;
  retryLimit: number;
  retryDelay: number;
}

export interface WorkerOptions {
  id: string;
  concurrency: number;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  queueSize: number;
  activeWorkers: number;
  completedJobs: number;
  failedJobs: number;
  uptime: number;
}

export interface Metrics {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageProcessingTime: number;
  queueDepth: number;
  activeWorkers: number;
}

export type JobProcessor = (job: AudioJob) => Promise<any>;

export interface Logger {
  info(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}