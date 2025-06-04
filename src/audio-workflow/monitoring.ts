import { HealthStatus, Metrics } from './types';
import { AudioQueue } from './queue';
import { WorkerPool } from './worker-pool';
import { StructuredLogger } from './logger';

export class MonitoringService {
  private queue: AudioQueue;
  private workerPool: WorkerPool;
  private logger: StructuredLogger;
  private metricsHistory: Metrics[] = [];
  private processingTimes: number[] = [];

  constructor(queue: AudioQueue, workerPool: WorkerPool) {
    this.queue = queue;
    this.workerPool = workerPool;
    this.logger = new StructuredLogger('MonitoringService');
  }

  getHealthStatus(): HealthStatus {
    const queueSize = this.queue.getQueueSize();
    const activeWorkers = this.workerPool.getActiveWorkerCount();
    const completedJobs = this.queue.getCompletedCount();
    const failedJobs = this.queue.getFailedCount();
    const uptime = this.queue.getUptime();

    const isHealthy = queueSize < 1000 && activeWorkers > 0 && (failedJobs / (completedJobs + failedJobs) < 0.1);

    const status: HealthStatus = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      queueSize,
      activeWorkers,
      completedJobs,
      failedJobs,
      uptime
    };

    this.logger.info('Health check performed', status);
    return status;
  }

  getMetrics(): Metrics {
    const totalJobs = this.queue.getCompletedCount() + this.queue.getFailedCount() + 
                      this.queue.getActiveCount() + this.queue.getQueueSize();
    
    const metrics: Metrics = {
      totalJobs,
      completedJobs: this.queue.getCompletedCount(),
      failedJobs: this.queue.getFailedCount(),
      averageProcessingTime: this.calculateAverageProcessingTime(),
      queueDepth: this.queue.getQueueSize(),
      activeWorkers: this.workerPool.getActiveWorkerCount()
    };

    this.metricsHistory.push(metrics);
    if (this.metricsHistory.length > 1000) {
      this.metricsHistory.shift();
    }

    this.logger.info('Metrics collected', metrics);
    return metrics;
  }

  recordProcessingTime(time: number): void {
    this.processingTimes.push(time);
    if (this.processingTimes.length > 1000) {
      this.processingTimes.shift();
    }
  }

  private calculateAverageProcessingTime(): number {
    if (this.processingTimes.length === 0) return 0;
    
    const sum = this.processingTimes.reduce((a, b) => a + b, 0);
    return sum / this.processingTimes.length;
  }

  getMetricsHistory(): Metrics[] {
    return [...this.metricsHistory];
  }

  startPeriodicHealthCheck(intervalMs: number = 60000): NodeJS.Timeout {
    const interval = setInterval(() => {
      this.getHealthStatus();
      this.getMetrics();
    }, intervalMs);

    this.logger.info('Periodic health check started', { intervalMs });
    return interval;
  }
}