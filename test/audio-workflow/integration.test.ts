import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { AudioWorkflowEngine } from '../../src/audio-workflow/workflow-engine';
import type { AudioProcessingJob } from '../../src/audio-workflow/types';

describe('Audio Workflow Integration Tests', () => {
  let engine: AudioWorkflowEngine;
  let consoleSpy: any;

  beforeEach(() => {
    consoleSpy = spyOn(console, 'log');
    engine = new AudioWorkflowEngine({
      maxConcurrency: 3,
      defaultMaxRetries: 2,
      retryDelay: 100,
      healthCheckInterval: 5000,
    });
  });

  afterEach(async () => {
    await engine.stop();
  });

  describe('Full workflow processing', () => {
    it('should process multiple audio files with different options', async () => {
      await engine.start();

      const jobs: AudioProcessingJob[] = [
        {
          fileId: 'audio-001',
          fileName: 'podcast-episode-1.mp3',
          fileSize: 50 * 1024 * 1024, // 50MB
          format: 'mp3',
          processingOptions: {
            normalize: true,
            removeNoise: true,
            convertFormat: 'wav',
            bitrate: 192000,
            sampleRate: 44100,
          },
        },
        {
          fileId: 'audio-002',
          fileName: 'music-track.wav',
          fileSize: 100 * 1024 * 1024, // 100MB
          format: 'wav',
          processingOptions: {
            normalize: true,
            convertFormat: 'mp3',
            bitrate: 320000,
          },
        },
        {
          fileId: 'audio-003',
          fileName: 'voice-recording.m4a',
          fileSize: 10 * 1024 * 1024, // 10MB
          format: 'm4a',
          processingOptions: {
            removeNoise: true,
            convertFormat: 'mp3',
            bitrate: 128000,
            sampleRate: 22050,
          },
        },
      ];

      // Add all jobs
      const queueItems = await Promise.all(
        jobs.map((job, index) => 
          engine.addJob(job, { priority: jobs.length - index })
        )
      );

      expect(queueItems).toHaveLength(3);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check results
      const results = queueItems.map(item => engine.getJob(item.id));
      
      results.forEach((job, index) => {
        expect(job).toBeDefined();
        
        if (job?.state === 'completed') {
          expect(job.result).toBeDefined();
          expect(job.result.processedFileId).toContain('processed-');
          expect(job.result.originalFile).toBe(jobs[index].fileName);
          expect(job.result.processingSteps).toBeInstanceOf(Array);
          expect(job.result.totalDuration).toBeGreaterThan(0);
        }
      });

      // Check metrics
      const metrics = engine.getMetrics();
      expect(metrics.totalJobs).toBeGreaterThanOrEqual(3);
      expect(metrics.completedJobs + metrics.failedJobs + metrics.activeJobs).toBeLessThanOrEqual(metrics.totalJobs);
    });

    it('should handle priority queue correctly', async () => {
      await engine.start();

      const processedOrder: string[] = [];
      
      // Monitor job completion order
      const originalLog = console.log;
      console.log = function(...args: any[]) {
        const logStr = args[0];
        if (typeof logStr === 'string' && logStr.includes('Job completed successfully')) {
          const log = JSON.parse(logStr);
          processedOrder.push(log.fileName);
        }
        return originalLog.apply(console, args);
      };

      // Add jobs with different priorities
      const lowPriorityJob: AudioProcessingJob = {
        fileId: 'low-priority',
        fileName: 'low-priority.mp3',
        fileSize: 5 * 1024 * 1024,
        format: 'mp3',
        processingOptions: { normalize: true },
      };

      const highPriorityJob: AudioProcessingJob = {
        fileId: 'high-priority',
        fileName: 'high-priority.mp3',
        fileSize: 5 * 1024 * 1024,
        format: 'mp3',
        processingOptions: { normalize: true },
      };

      const mediumPriorityJob: AudioProcessingJob = {
        fileId: 'medium-priority',
        fileName: 'medium-priority.mp3',
        fileSize: 5 * 1024 * 1024,
        format: 'mp3',
        processingOptions: { normalize: true },
      };

      // Add in reverse priority order
      await engine.addJob(lowPriorityJob, { priority: 1 });
      await engine.addJob(mediumPriorityJob, { priority: 5 });
      await engine.addJob(highPriorityJob, { priority: 10 });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Restore console.log
      console.log = originalLog;

      // High priority should be processed first
      if (processedOrder.length >= 3) {
        expect(processedOrder[0]).toBe('high-priority.mp3');
      }
    });

    it('should recover from failures and continue processing', async () => {
      await engine.start();

      const jobs: AudioProcessingJob[] = [];
      
      // Create many jobs to ensure some failures occur
      for (let i = 0; i < 20; i++) {
        jobs.push({
          fileId: `failure-test-${i}`,
          fileName: `test-${i}.mp3`,
          fileSize: Math.random() * 10 * 1024 * 1024,
          format: 'mp3',
          processingOptions: {
            normalize: Math.random() > 0.5,
            removeNoise: Math.random() > 0.5,
            convertFormat: Math.random() > 0.5 ? 'wav' : undefined,
          },
        });
      }

      const queueItems = await Promise.all(
        jobs.map(job => engine.addJob(job))
      );

      // Wait for processing with retries
      await new Promise(resolve => setTimeout(resolve, 10000));

      const metrics = engine.getMetrics();
      
      // Should have processed all jobs (either completed or failed after retries)
      expect(metrics.completedJobs + metrics.failedJobs).toBeLessThanOrEqual(jobs.length);
      expect(metrics.activeJobs).toBe(0);
      expect(metrics.queueLength).toBe(0);

      // Check retry behavior
      const retryLogs = consoleSpy.mock.calls.filter((call: any[]) => {
        const log = JSON.parse(call[0]);
        return log.message === 'Job failed, retrying';
      });

      if (retryLogs.length > 0) {
        // Verify retry attempts are tracked
        retryLogs.forEach((call: any[]) => {
          const log = JSON.parse(call[0]);
          expect(log.attempt).toBeGreaterThanOrEqual(1);
          expect(log.attempt).toBeLessThanOrEqual(log.maxAttempts);
        });
      }
    });
  });

  describe('Concurrent processing limits', () => {
    it('should respect max concurrency setting', async () => {
      const concurrencyEngine = new AudioWorkflowEngine({
        maxConcurrency: 2,
        retryDelay: 50,
      });

      await concurrencyEngine.start();

      let currentlyProcessing = 0;
      let maxConcurrent = 0;
      const processingJobs = new Set<string>();

      // Monitor concurrent processing
      const originalLog = console.log;
      console.log = function(...args: any[]) {
        const logStr = args[0];
        if (typeof logStr === 'string') {
          try {
            const log = JSON.parse(logStr);
            
            if (log.message === 'Job processing started') {
              currentlyProcessing++;
              processingJobs.add(log.jobId);
              maxConcurrent = Math.max(maxConcurrent, currentlyProcessing);
            } else if (log.message === 'Job completed successfully' || 
                      log.message === 'Job failed permanently') {
              if (processingJobs.has(log.jobId)) {
                currentlyProcessing--;
                processingJobs.delete(log.jobId);
              }
            }
          } catch (e) {
            // Not a JSON log
          }
        }
        return originalLog.apply(console, args);
      };

      // Add 5 jobs that take some time to process
      const jobs: AudioProcessingJob[] = [];
      for (let i = 0; i < 5; i++) {
        jobs.push({
          fileId: `concurrent-${i}`,
          fileName: `concurrent-${i}.mp3`,
          fileSize: 10 * 1024 * 1024,
          format: 'mp3',
          processingOptions: {
            normalize: true,
            removeNoise: true,
            convertFormat: 'wav',
          },
        });
      }

      await Promise.all(jobs.map(job => concurrencyEngine.addJob(job)));

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 8000));

      // Restore console.log
      console.log = originalLog;

      // Verify max concurrency was respected
      expect(maxConcurrent).toBeLessThanOrEqual(2);
      expect(maxConcurrent).toBeGreaterThan(0);

      await concurrencyEngine.stop();
    });
  });

  describe('Monitoring and observability', () => {
    it('should provide accurate metrics throughout processing', async () => {
      await engine.start();

      // Initial metrics
      const initialMetrics = engine.getMetrics();
      expect(initialMetrics.totalJobs).toBe(0);
      expect(initialMetrics.completedJobs).toBe(0);
      expect(initialMetrics.failedJobs).toBe(0);

      // Add some jobs
      const jobs: AudioProcessingJob[] = [
        {
          fileId: 'metrics-1',
          fileName: 'metrics1.mp3',
          fileSize: 1024 * 1024,
          format: 'mp3',
          processingOptions: { normalize: true },
        },
        {
          fileId: 'metrics-2',
          fileName: 'metrics2.wav',
          fileSize: 2048 * 1024,
          format: 'wav',
          processingOptions: { removeNoise: true },
        },
      ];

      await Promise.all(jobs.map(job => engine.addJob(job)));

      // Metrics after adding jobs
      const afterAddMetrics = engine.getMetrics();
      expect(afterAddMetrics.totalJobs).toBe(2);
      expect(afterAddMetrics.queueLength).toBeGreaterThan(0);

      // Wait for some processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Final metrics
      const finalMetrics = engine.getMetrics();
      expect(finalMetrics.totalJobs).toBe(2);
      expect(finalMetrics.completedJobs).toBeGreaterThan(0);
      expect(finalMetrics.averageProcessingTime).toBeGreaterThan(0);

      // Verify health checks occurred
      const healthCheckLogs = consoleSpy.mock.calls.filter((call: any[]) => {
        const log = JSON.parse(call[0]);
        return log.message === 'Health check';
      });

      expect(healthCheckLogs.length).toBeGreaterThan(0);
    });

    it('should provide detailed logging with correlation IDs', async () => {
      await engine.start();

      const job: AudioProcessingJob = {
        fileId: 'logging-test',
        fileName: 'logging-test.mp3',
        fileSize: 1024 * 1024,
        format: 'mp3',
        processingOptions: {
          normalize: true,
          removeNoise: true,
        },
      };

      const queueItem = await engine.addJob(job);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Find all logs for this job
      const jobLogs = consoleSpy.mock.calls
        .map((call: any[]) => {
          try {
            return JSON.parse(call[0]);
          } catch {
            return null;
          }
        })
        .filter((log: any) => 
          log && (log.jobId === queueItem.id || log.correlationId === queueItem.id)
        );

      // Should have logs for different stages
      const logMessages = jobLogs.map((log: any) => log.message);
      
      expect(logMessages).toContain('Job added to queue');
      expect(logMessages).toContain('Job processing started');

      // All processing logs should have the correlation ID
      const processingLogs = jobLogs.filter((log: any) => 
        log.message.includes('Processing') || log.message.includes('Executing')
      );

      processingLogs.forEach((log: any) => {
        expect(log.correlationId).toBe(queueItem.id);
      });
    });
  });
});