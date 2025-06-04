import { describe, test, expect, beforeEach } from 'bun:test';
import { AudioQueue } from '../../src/audio-workflow/queue';
import { WorkerPool } from '../../src/audio-workflow/worker-pool';
import { MonitoringService } from '../../src/audio-workflow/monitoring';

describe('MonitoringService', () => {
  let queue: AudioQueue;
  let workerPool: WorkerPool;
  let monitoring: MonitoringService;

  beforeEach(() => {
    queue = new AudioQueue();
    workerPool = new WorkerPool(queue);
    monitoring = new MonitoringService(queue, workerPool);
  });

  describe('health status', () => {
    test('should report healthy status when conditions are met', () => {
      workerPool.createWorker({ id: 'worker-1', concurrency: 2 }, async () => {});
      
      const status = monitoring.getHealthStatus();
      
      expect(status.status).toBe('healthy');
      expect(status.queueSize).toBe(0);
      expect(status.activeWorkers).toBe(1);
      expect(status.completedJobs).toBe(0);
      expect(status.failedJobs).toBe(0);
      expect(status.uptime).toBeGreaterThan(0);
    });

    test('should report unhealthy status when queue is too large', () => {
      workerPool.createWorker({ id: 'worker-1', concurrency: 2 }, async () => {});
      
      // Add many jobs to make queue unhealthy
      for (let i = 0; i < 1001; i++) {
        queue.enqueue({ data: `test-${i}` });
      }
      
      const status = monitoring.getHealthStatus();
      expect(status.status).toBe('unhealthy');
      expect(status.queueSize).toBe(1001);
    });

    test('should report unhealthy status when no workers are active', () => {
      const status = monitoring.getHealthStatus();
      expect(status.status).toBe('unhealthy');
      expect(status.activeWorkers).toBe(0);
    });
  });

  describe('metrics', () => {
    test('should collect basic metrics', () => {
      workerPool.createWorker({ id: 'worker-1', concurrency: 2 }, async () => {});
      
      queue.enqueue({ data: 'test1' });
      queue.enqueue({ data: 'test2' });
      
      const metrics = monitoring.getMetrics();
      
      expect(metrics.totalJobs).toBe(2);
      expect(metrics.queueDepth).toBe(2);
      expect(metrics.activeWorkers).toBe(1);
      expect(metrics.completedJobs).toBe(0);
      expect(metrics.failedJobs).toBe(0);
      expect(metrics.averageProcessingTime).toBe(0);
    });

    test('should track processing times', () => {
      monitoring.recordProcessingTime(100);
      monitoring.recordProcessingTime(200);
      monitoring.recordProcessingTime(300);
      
      const metrics = monitoring.getMetrics();
      expect(metrics.averageProcessingTime).toBe(200);
    });

    test('should maintain metrics history', () => {
      monitoring.getMetrics();
      monitoring.getMetrics();
      monitoring.getMetrics();
      
      const history = monitoring.getMetricsHistory();
      expect(history).toHaveLength(3);
    });

    test('should limit metrics history size', () => {
      // Create more than 1000 metrics entries
      for (let i = 0; i < 1005; i++) {
        monitoring.getMetrics();
      }
      
      const history = monitoring.getMetricsHistory();
      expect(history).toHaveLength(1000);
    });
  });

  describe('periodic health check', () => {
    test('should start and stop periodic health check', async () => {
      let healthCheckCount = 0;
      let metricsCount = 0;
      
      // Override methods to count calls
      const originalGetHealth = monitoring.getHealthStatus;
      const originalGetMetrics = monitoring.getMetrics;
      
      monitoring.getHealthStatus = function() {
        healthCheckCount++;
        return originalGetHealth.call(this);
      };
      
      monitoring.getMetrics = function() {
        metricsCount++;
        return originalGetMetrics.call(this);
      };
      
      const interval = monitoring.startPeriodicHealthCheck(100);
      
      await new Promise(resolve => setTimeout(resolve, 350));
      
      clearInterval(interval);
      
      expect(healthCheckCount).toBeGreaterThanOrEqual(3);
      expect(metricsCount).toBeGreaterThanOrEqual(3);
    });
  });
});