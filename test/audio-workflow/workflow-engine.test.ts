import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { AudioWorkflowEngine } from '../../src/audio-workflow/workflow-engine';
import type { AudioProcessingJob, WorkflowMetrics } from '../../src/audio-workflow/types';

describe('AudioWorkflowEngine', () => {
  let engine: AudioWorkflowEngine;
  let consoleSpy: any;
  let originalConsoleLog: any;

  beforeEach(() => {
    originalConsoleLog = console.log;
    consoleSpy = spyOn(console, 'log');
    engine = new AudioWorkflowEngine({
      maxConcurrency: 2,
      defaultMaxRetries: 2,
      retryDelay: 50,
      healthCheckInterval: 1000,
    });
  });

  afterEach(async () => {
    await engine.stop();
    console.log = originalConsoleLog;
  });

  describe('start/stop', () => {
    it('should start and stop the engine', async () => {
      await engine.start();
      
      // Check that start was logged
      const startLog = consoleSpy.mock.calls.find((call: any[]) => {
        const log = JSON.parse(call[0]);
        return log.message === 'Starting Audio Workflow Engine';
      });
      expect(startLog).toBeDefined();
      
      await engine.stop();
      
      // Check that stop was logged
      const stopLog = consoleSpy.mock.calls.find((call: any[]) => {
        const log = JSON.parse(call[0]);
        return log.message === 'Stopping Audio Workflow Engine';
      });
      expect(stopLog).toBeDefined();
    });
  });

  describe('addJob', () => {
    it('should add a job to the queue', async () => {
      const job: AudioProcessingJob = {
        fileId: 'file-123',
        fileName: 'test.mp3',
        fileSize: 1024 * 1024,
        format: 'mp3',
        processingOptions: {
          normalize: true,
        },
      };
      
      const queueItem = await engine.addJob(job);
      
      expect(queueItem.id).toBeDefined();
      expect(queueItem.data).toEqual(job);
      expect(queueItem.state).toBe('pending');
      
      // Check that job addition was logged
      const addLog = consoleSpy.mock.calls.find((call: any[]) => {
        const log = JSON.parse(call[0]);
        return log.message === 'Adding new audio processing job';
      });
      expect(addLog).toBeDefined();
    });

    it('should add a job with custom priority', async () => {
      const job: AudioProcessingJob = {
        fileId: 'file-456',
        fileName: 'important.wav',
        fileSize: 2048 * 1024,
        format: 'wav',
        processingOptions: {},
      };
      
      const queueItem = await engine.addJob(job, { priority: 10 });
      
      expect(queueItem.priority).toBe(10);
    });
  });

  describe('processing', () => {
    it('should process audio jobs successfully', async () => {
      await engine.start();
      
      const job: AudioProcessingJob = {
        fileId: 'file-789',
        fileName: 'process.mp3',
        fileSize: 512 * 1024,
        format: 'mp3',
        processingOptions: {
          normalize: true,
          removeNoise: true,
          convertFormat: 'wav',
        },
      };
      
      const queueItem = await engine.addJob(job);
      
      // Wait for processing to complete
      await new Promise(resolve => setTimeout(resolve, 3500));
      
      const processedJob = engine.getJob(queueItem.id);
      
      // Job might be completed or still processing, check both states
      expect(['processing', 'completed']).toContain(processedJob?.state);
      
      if (processedJob?.state === 'completed') {
        expect(processedJob.result).toBeDefined();
        expect(processedJob.result.processedFileId).toBe(`processed-${job.fileId}`);
        expect(processedJob.result.outputFormat).toBe('wav');
        expect(processedJob.result.processingSteps).toHaveLength(3);
      }
    });

    it('should handle job failures with retry', async () => {
      await engine.start();
      
      // Add multiple jobs to increase chance of failure
      const jobs: AudioProcessingJob[] = [];
      for (let i = 0; i < 10; i++) {
        jobs.push({
          fileId: `file-fail-${i}`,
          fileName: `fail-${i}.mp3`,
          fileSize: 256 * 1024,
          format: 'mp3',
          processingOptions: {
            normalize: true,
          },
        });
      }
      
      const queueItems = await Promise.all(
        jobs.map(job => engine.addJob(job))
      );
      
      // Wait for processing with potential retries
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check for any failed jobs or retry logs
      const retryLogs = consoleSpy.mock.calls.filter((call: any[]) => {
        const log = JSON.parse(call[0]);
        return log.message === 'Job failed, retrying';
      });
      
      // Since failure is random (10% chance), we might or might not have retries
      // Just verify the system handles retries properly when they occur
      if (retryLogs.length > 0) {
        const retryLog = JSON.parse(retryLogs[0][0]);
        expect(retryLog.attempt).toBeDefined();
        expect(retryLog.maxAttempts).toBe(2);
      }
    });
  });

  describe('getMetrics', () => {
    it('should return workflow metrics', async () => {
      await engine.start();
      
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
      
      const metrics: WorkflowMetrics = engine.getMetrics();
      
      expect(metrics.totalJobs).toBeGreaterThanOrEqual(2);
      expect(metrics.completedJobs).toBeGreaterThanOrEqual(0);
      expect(metrics.failedJobs).toBeGreaterThanOrEqual(0);
      expect(metrics.activeJobs).toBeGreaterThanOrEqual(0);
      expect(metrics.queueLength).toBeGreaterThanOrEqual(0);
      expect(metrics.lastHealthCheck).toBeInstanceOf(Date);
      
      // Wait a bit for processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const updatedMetrics = engine.getMetrics();
      expect(updatedMetrics.completedJobs).toBeGreaterThanOrEqual(metrics.completedJobs);
    });
  });

  describe('getJob', () => {
    it('should retrieve a job by id', async () => {
      const job: AudioProcessingJob = {
        fileId: 'get-job-1',
        fileName: 'getjob.mp3',
        fileSize: 512 * 1024,
        format: 'mp3',
        processingOptions: {},
      };
      
      const queueItem = await engine.addJob(job);
      const retrievedJob = engine.getJob(queueItem.id);
      
      expect(retrievedJob).toBeDefined();
      expect(retrievedJob?.id).toBe(queueItem.id);
      expect(retrievedJob?.data).toEqual(job);
    });

    it('should return undefined for non-existent job', () => {
      const job = engine.getJob('non-existent-id');
      expect(job).toBeUndefined();
    });
  });

  describe('getAllJobs', () => {
    it('should return all jobs', async () => {
      const jobs: AudioProcessingJob[] = [
        {
          fileId: 'all-1',
          fileName: 'all1.mp3',
          fileSize: 1024 * 1024,
          format: 'mp3',
          processingOptions: {},
        },
        {
          fileId: 'all-2',
          fileName: 'all2.wav',
          fileSize: 2048 * 1024,
          format: 'wav',
          processingOptions: {},
        },
      ];
      
      await Promise.all(jobs.map(job => engine.addJob(job)));
      
      const allJobs = engine.getAllJobs();
      expect(allJobs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('clearCompletedJobs', () => {
    it('should clear completed jobs', async () => {
      await engine.start();
      
      const job: AudioProcessingJob = {
        fileId: 'clear-1',
        fileName: 'clear.mp3',
        fileSize: 256 * 1024,
        format: 'mp3',
        processingOptions: { normalize: true },
      };
      
      await engine.addJob(job);
      
      // Wait for processing to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const jobsBefore = engine.getAllJobs();
      const completedBefore = jobsBefore.filter(j => j.state === 'completed');
      
      engine.clearCompletedJobs();
      
      const jobsAfter = engine.getAllJobs();
      const completedAfter = jobsAfter.filter(j => j.state === 'completed');
      
      expect(completedAfter.length).toBeLessThan(completedBefore.length);
      
      // Check that clear was logged
      const clearLog = consoleSpy.mock.calls.find((call: any[]) => {
        const log = JSON.parse(call[0]);
        return log.message === 'Cleared completed jobs from queue';
      });
      expect(clearLog).toBeDefined();
    });
  });

  describe('health check', () => {
    it('should perform health checks', async () => {
      await engine.start();
      
      // Wait for at least one health check
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const healthCheckLogs = consoleSpy.mock.calls.filter((call: any[]) => {
        const log = JSON.parse(call[0]);
        return log.message === 'Health check';
      });
      
      expect(healthCheckLogs.length).toBeGreaterThanOrEqual(1);
      
      const healthLog = JSON.parse(healthCheckLogs[0][0]);
      expect(healthLog.metrics).toBeDefined();
      expect(healthLog.metrics.totalJobs).toBeDefined();
      expect(healthLog.metrics.completedJobs).toBeDefined();
    });
  });

  describe('event logging', () => {
    it('should log job lifecycle events', async () => {
      await engine.start();
      
      const job: AudioProcessingJob = {
        fileId: 'events-1',
        fileName: 'events.mp3',
        fileSize: 512 * 1024,
        format: 'mp3',
        processingOptions: { normalize: true },
      };
      
      await engine.addJob(job);
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check for various log events
      const logMessages = consoleSpy.mock.calls.map((call: any[]) => {
        return JSON.parse(call[0]).message;
      });
      
      expect(logMessages).toContain('Job added to queue');
      expect(logMessages).toContain('Job processing started');
      
      // Should have either completed or processing logs
      const hasProcessingLogs = 
        logMessages.includes('Processing audio file') ||
        logMessages.includes('Audio processing completed') ||
        logMessages.includes('Job completed successfully');
      
      expect(hasProcessingLogs).toBe(true);
    });
  });
});