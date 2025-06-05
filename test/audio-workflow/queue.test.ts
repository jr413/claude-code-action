import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { Queue } from '../../src/audio-workflow/queue';
import type { QueueItem } from '../../src/audio-workflow/types';

describe('Queue', () => {
  let queue: Queue<{ data: string }>;

  beforeEach(() => {
    queue = new Queue({
      maxConcurrency: 2,
      defaultMaxRetries: 2,
      retryDelay: 100,
    });
  });

  afterEach(() => {
    queue.stop();
  });

  describe('add', () => {
    it('should add a job to the queue', async () => {
      const job = await queue.add({ data: 'test' });
      
      expect(job.id).toBeDefined();
      expect(job.data).toEqual({ data: 'test' });
      expect(job.state).toBe('pending');
      expect(job.priority).toBe(0);
      expect(job.retryCount).toBe(0);
    });

    it('should add a job with custom priority', async () => {
      const job = await queue.add({ data: 'test' }, { priority: 5 });
      
      expect(job.priority).toBe(5);
    });

    it('should add a job with custom maxRetries', async () => {
      const job = await queue.add({ data: 'test' }, { maxRetries: 5 });
      
      expect(job.maxRetries).toBe(5);
    });
  });

  describe('getJob', () => {
    it('should retrieve a job by id', async () => {
      const addedJob = await queue.add({ data: 'test' });
      const retrievedJob = queue.getJob(addedJob.id);
      
      expect(retrievedJob).toEqual(addedJob);
    });

    it('should return undefined for non-existent job', () => {
      const job = queue.getJob('non-existent');
      
      expect(job).toBeUndefined();
    });
  });

  describe('getAllJobs', () => {
    it('should return all jobs', async () => {
      await queue.add({ data: 'test1' });
      await queue.add({ data: 'test2' });
      
      const jobs = queue.getAllJobs();
      
      expect(jobs).toHaveLength(2);
      expect(jobs[0].data).toEqual({ data: 'test1' });
      expect(jobs[1].data).toEqual({ data: 'test2' });
    });
  });

  describe('getJobsByState', () => {
    it('should return jobs by state', async () => {
      const processor = jest.fn().mockResolvedValue('result');
      queue.setProcessor(processor);
      
      const job1 = await queue.add({ data: 'test1' });
      const job2 = await queue.add({ data: 'test2' });
      
      queue.start();
      
      // Wait for processing to start
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const pendingJobs = queue.getJobsByState('pending');
      const processingJobs = queue.getJobsByState('processing');
      
      expect(pendingJobs.length + processingJobs.length).toBe(2);
      
      queue.stop();
    });
  });

  describe('processing', () => {
    it('should process jobs with the configured processor', async () => {
      const processor = jest.fn().mockResolvedValue('result');
      queue.setProcessor(processor);
      
      const job = await queue.add({ data: 'test' });
      queue.start();
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(processor).toHaveBeenCalledWith(expect.objectContaining({
        id: job.id,
        data: { data: 'test' },
      }));
      
      const updatedJob = queue.getJob(job.id);
      expect(updatedJob?.state).toBe('completed');
      expect(updatedJob?.result).toBe('result');
    });

    it('should handle job failures and retry', async () => {
      let attemptCount = 0;
      const processor = jest.fn().mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error('Processing failed');
        }
        return 'success';
      });
      
      queue.setProcessor(processor);
      
      const job = await queue.add({ data: 'test' });
      queue.start();
      
      // Wait for retries
      await new Promise(resolve => setTimeout(resolve, 500));
      
      expect(processor).toHaveBeenCalledTimes(2);
      
      const updatedJob = queue.getJob(job.id);
      expect(updatedJob?.state).toBe('completed');
      expect(updatedJob?.result).toBe('success');
      expect(updatedJob?.retryCount).toBe(1);
    });

    it('should mark job as failed after max retries', async () => {
      const processor = jest.fn().mockRejectedValue(new Error('Always fails'));
      queue.setProcessor(processor);
      
      const job = await queue.add({ data: 'test' }, { maxRetries: 2 });
      queue.start();
      
      // Wait for all retries
      await new Promise(resolve => setTimeout(resolve, 800));
      
      expect(processor).toHaveBeenCalledTimes(3); // Initial + 2 retries
      
      const updatedJob = queue.getJob(job.id);
      expect(updatedJob?.state).toBe('failed');
      expect(updatedJob?.error?.message).toBe('Always fails');
      expect(updatedJob?.retryCount).toBe(2);
    });

    it('should respect max concurrency', async () => {
      let concurrentJobs = 0;
      let maxConcurrent = 0;
      
      const processor = jest.fn().mockImplementation(async () => {
        concurrentJobs++;
        maxConcurrent = Math.max(maxConcurrent, concurrentJobs);
        await new Promise(resolve => setTimeout(resolve, 100));
        concurrentJobs--;
        return 'done';
      });
      
      queue.setProcessor(processor);
      
      // Add 5 jobs
      for (let i = 0; i < 5; i++) {
        await queue.add({ data: `test${i}` });
      }
      
      queue.start();
      
      // Wait for all jobs to process
      await new Promise(resolve => setTimeout(resolve, 600));
      
      expect(maxConcurrent).toBeLessThanOrEqual(2); // maxConcurrency is 2
      expect(processor).toHaveBeenCalledTimes(5);
    });

    it('should process jobs by priority', async () => {
      const processedOrder: string[] = [];
      const processor = jest.fn().mockImplementation(async (job: QueueItem) => {
        processedOrder.push(job.data.data);
        return 'done';
      });
      
      queue.setProcessor(processor);
      
      // Add jobs with different priorities
      await queue.add({ data: 'low' }, { priority: 1 });
      await queue.add({ data: 'high' }, { priority: 10 });
      await queue.add({ data: 'medium' }, { priority: 5 });
      
      queue.start();
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 400));
      
      expect(processedOrder[0]).toBe('high');
      expect(processedOrder[1]).toBe('medium');
      expect(processedOrder[2]).toBe('low');
    });
  });

  describe('clearCompleted', () => {
    it('should remove completed jobs', async () => {
      const processor = jest.fn().mockResolvedValue('done');
      queue.setProcessor(processor);
      
      await queue.add({ data: 'test1' });
      await queue.add({ data: 'test2' });
      
      queue.start();
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 300));
      
      expect(queue.getAllJobs()).toHaveLength(2);
      
      queue.clearCompleted();
      
      expect(queue.getAllJobs()).toHaveLength(0);
    });
  });

  describe('events', () => {
    it('should emit jobAdded event', async () => {
      const handler = jest.fn();
      queue.on('jobAdded', handler);
      
      const job = await queue.add({ data: 'test' });
      
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        id: job.id,
        data: { data: 'test' },
      }));
    });

    it('should emit jobStarted event', async () => {
      const handler = jest.fn();
      queue.on('jobStarted', handler);
      
      const processor = jest.fn().mockResolvedValue('done');
      queue.setProcessor(processor);
      
      const job = await queue.add({ data: 'test' });
      queue.start();
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        id: job.id,
        state: 'processing',
      }));
    });

    it('should emit jobCompleted event', async () => {
      const handler = jest.fn();
      queue.on('jobCompleted', handler);
      
      const processor = jest.fn().mockResolvedValue('result');
      queue.setProcessor(processor);
      
      const job = await queue.add({ data: 'test' });
      queue.start();
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        id: job.id,
        state: 'completed',
        result: 'result',
      }));
    });

    it('should emit jobFailed event', async () => {
      const handler = jest.fn();
      queue.on('jobFailed', handler);
      
      const error = new Error('Job failed');
      const processor = jest.fn().mockRejectedValue(error);
      queue.setProcessor(processor);
      
      const job = await queue.add({ data: 'test' }, { maxRetries: 0 });
      queue.start();
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          id: job.id,
          state: 'failed',
        }),
        error
      );
    });

    it('should emit jobRetrying event', async () => {
      const handler = jest.fn();
      queue.on('jobRetrying', handler);
      
      let attempt = 0;
      const processor = jest.fn().mockImplementation(async () => {
        attempt++;
        if (attempt === 1) {
          throw new Error('First attempt failed');
        }
        return 'success';
      });
      
      queue.setProcessor(processor);
      
      const job = await queue.add({ data: 'test' });
      queue.start();
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          id: job.id,
        }),
        1
      );
    });
  });

  describe('getMetrics', () => {
    it('should return queue metrics', async () => {
      const processor = jest.fn().mockImplementation(async (job: QueueItem) => {
        if (job.data.data === 'fail') {
          throw new Error('Failed');
        }
        return 'done';
      });
      
      queue.setProcessor(processor);
      
      await queue.add({ data: 'success1' });
      await queue.add({ data: 'success2' });
      await queue.add({ data: 'fail' }, { maxRetries: 0 });
      
      queue.start();
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const metrics = queue.getMetrics();
      
      expect(metrics.total).toBe(3);
      expect(metrics.completed).toBe(2);
      expect(metrics.failed).toBe(1);
      expect(metrics.pending).toBe(0);
      expect(metrics.processing).toBe(0);
    });
  });
});