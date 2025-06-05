export type ProcessingState = 'pending' | 'processing' | 'completed' | 'failed';

export interface QueueItem<T = any> {
  id: string;
  data: T;
  state: ProcessingState;
  priority: number;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
  error?: Error;
  result?: any;
}

export interface QueueConfig {
  maxConcurrency: number;
  defaultMaxRetries: number;
  retryDelay: number;
  healthCheckInterval: number;
}

export interface AudioProcessingJob {
  fileId: string;
  fileName: string;
  fileSize: number;
  format: string;
  processingOptions: ProcessingOptions;
}

export interface ProcessingOptions {
  normalize?: boolean;
  removeNoise?: boolean;
  convertFormat?: string;
  bitrate?: number;
  sampleRate?: number;
}

export interface WorkflowMetrics {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  activeJobs: number;
  averageProcessingTime: number;
  queueLength: number;
  lastHealthCheck: Date;
}

export interface Logger {
  info(message: string, metadata?: Record<string, any>): void;
  warn(message: string, metadata?: Record<string, any>): void;
  error(message: string, error?: Error, metadata?: Record<string, any>): void;
  debug(message: string, metadata?: Record<string, any>): void;
}

export type JobProcessor<T = any> = (job: QueueItem<T>) => Promise<any>;

export interface QueueEvents {
  jobAdded: (job: QueueItem) => void;
  jobStarted: (job: QueueItem) => void;
  jobCompleted: (job: QueueItem) => void;
  jobFailed: (job: QueueItem, error: Error) => void;
  jobRetrying: (job: QueueItem, attempt: number) => void;
}