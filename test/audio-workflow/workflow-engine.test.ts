import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { AudioWorkflowEngine } from '../../src/audio-workflow/workflow-engine';
import { JobStatus } from '../../src/audio-workflow/types';

describe('AudioWorkflowEngine', () => {
  let engine: AudioWorkflowEngine;

  beforeEach(() => {
    engine = new AudioWorkflowEngine({
      queueOptions: {
        maxConcurrency: 3,
        retryLimit: 2,
        retryDelay: 50
      }
    });
  });

  afterEach(() => {
    engine.shutdown();
  });

  describe('initialization', () => {
    test('should initialize with default options', () => {
      const defaultEngine = new AudioWorkflowEngine();
      expect(defaultEngine).toBeDefined();
      expect(defaultEngine.getQueueStats().pending).toBe(0);
      defaultEngine.shutdown();
    });

    test('should initialize with custom workers', () => {
      const engineWithWorkers = new AudioWorkflowEngine({
        workers: [
          { id: 'worker-1', concurrency: 2 },
          { id: 'worker-2', concurrency: 3 }
        ]
      });
      
      expect(engineWithWorkers.getHealthStatus().activeWorkers).toBe(2);
      engineWithWorkers.shutdown();
    });
  });

  describe('job processing', () => {
    test('should enqueue and process jobs', async () => {
      engine.addWorker({ id: 'worker-1', concurrency: 2 });
      
      const job1 = engine.enqueueJob({ audioFile: 'test1.mp3' });
      const job2 = engine.enqueueJob({ audioFile: 'test2.mp3' });
      
      expect(job1.status).toBe(JobStatus.PENDING);
      expect(job2.status).toBe(JobStatus.PENDING);
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const processedJob1 = engine.getJob(job1.id);
      const processedJob2 = engine.getJob(job2.id);
      
      // Most jobs should complete (90% success rate in mock)
      const completedCount = [processedJob1, processedJob2]
        .filter(job => job?.status === JobStatus.COMPLETED).length;
      
      expect(completedCount).toBeGreaterThanOrEqual(1);
    });

    test('should handle custom processor', async () => {
      let processedData: any[] = [];
      
      engine.setProcessor(async (job) => {
        processedData.push(job.data);
        return { processed: true, id: job.id };
      });
      
      engine.addWorker({ id: 'worker-1', concurrency: 1 });
      
      engine.enqueueJob({ custom: 'data1' });
      engine.enqueueJob({ custom: 'data2' });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      expect(processedData).toHaveLength(2);
      expect(processedData).toContainEqual({ custom: 'data1' });
      expect(processedData).toContainEqual({ custom: 'data2' });
    });
  });

  describe('monitoring', () => {
    test('should provide queue statistics', () => {
      engine.enqueueJob({ data: 'test1' });
      engine.enqueueJob({ data: 'test2' });
      engine.enqueueJob({ data: 'test3' });
      
      const stats = engine.getQueueStats();
      
      expect(stats.pending).toBe(3);
      expect(stats.processing).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.failed).toBe(0);
    });

    test('should provide health status', () => {
      engine.addWorker({ id: 'worker-1', concurrency: 2 });
      
      const health = engine.getHealthStatus();
      
      expect(health.status).toBe('healthy');
      expect(health.activeWorkers).toBe(1);
      expect(health.queueSize).toBe(0);
    });

    test('should provide metrics', () => {
      engine.addWorker({ id: 'worker-1', concurrency: 2 });
      engine.enqueueJob({ data: 'test' });
      
      const metrics = engine.getMetrics();
      
      expect(metrics.totalJobs).toBe(1);
      expect(metrics.activeWorkers).toBe(1);
      expect(metrics.queueDepth).toBe(1);
    });
  });

  describe('health monitoring', () => {
    test('should start and stop health monitoring', async () => {
      let metricsCallCount = 0;
      const originalGetMetrics = engine.getMetrics;
      
      engine.getMetrics = function() {
        metricsCallCount++;
        return originalGetMetrics.call(this);
      };
      
      engine.startHealthMonitoring(100);
      
      await new Promise(resolve => setTimeout(resolve, 350));
      
      engine.stopHealthMonitoring();
      
      // Should have been called at least 3 times
      expect(metricsCallCount).toBeGreaterThanOrEqual(3);
      
      // Wait a bit more to ensure it stopped
      const countBefore = metricsCallCount;
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(metricsCallCount).toBe(countBefore);
    });
  });

  describe('cleanup', () => {
    test('should clear job history', async () => {
      engine.setProcessor(async () => ({ result: 'success' }));
      engine.addWorker({ id: 'worker-1', concurrency: 5 });
      
      // Enqueue and process jobs
      for (let i = 0; i < 5; i++) {
        engine.enqueueJob({ data: `test${i}` });
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statsBefore = engine.getQueueStats();
      expect(statsBefore.completed).toBeGreaterThan(0);
      
      engine.clearHistory();
      
      const statsAfter = engine.getQueueStats();
      expect(statsAfter.completed).toBe(0);
      expect(statsAfter.failed).toBe(0);
    });

    test('should shutdown gracefully', () => {
      engine.addWorker({ id: 'worker-1', concurrency: 2 });
      engine.startHealthMonitoring(100);
      
      expect(engine.getHealthStatus().activeWorkers).toBe(1);
      
      engine.shutdown();
      
      expect(engine.getHealthStatus().activeWorkers).toBe(0);
    });
  });
});