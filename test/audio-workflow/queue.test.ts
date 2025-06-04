import { describe, test, expect, beforeEach } from 'bun:test';
import { AudioQueue } from '../../src/audio-workflow/queue';
import { JobStatus } from '../../src/audio-workflow/types';

describe('AudioQueue', () => {
  let queue: AudioQueue;

  beforeEach(() => {
    queue = new AudioQueue({
      maxConcurrency: 2,
      retryLimit: 2,
      retryDelay: 100
    });
  });

  describe('enqueue', () => {
    test('should create a job with pending status', () => {
      const job = queue.enqueue({ data: 'test' });
      
      expect(job.id).toBeDefined();
      expect(job.status).toBe(JobStatus.PENDING);
      expect(job.correlationId).toBeDefined();
      expect(job.retryCount).toBe(0);
      expect(job.data).toEqual({ data: 'test' });
    });

    test('should increment queue size', () => {
      expect(queue.getQueueSize()).toBe(0);
      
      queue.enqueue({ data: 'test1' });
      expect(queue.getQueueSize()).toBe(1);
      
      queue.enqueue({ data: 'test2' });
      expect(queue.getQueueSize()).toBe(2);
    });
  });

  describe('processing', () => {
    test('should process jobs with the processor', async () => {
      let processedJobs: any[] = [];
      
      queue.setProcessor(async (job) => {
        processedJobs.push(job.data);
        return { result: 'success' };
      });

      queue.enqueue({ data: 'test1' });
      queue.enqueue({ data: 'test2' });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(processedJobs).toContain({ data: 'test1' });
      expect(processedJobs).toContain({ data: 'test2' });
      expect(queue.getCompletedCount()).toBe(2);
    });

    test('should respect maxConcurrency', async () => {
      let concurrentJobs = 0;
      let maxConcurrentJobs = 0;

      queue.setProcessor(async (job) => {
        concurrentJobs++;
        maxConcurrentJobs = Math.max(maxConcurrentJobs, concurrentJobs);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        concurrentJobs--;
        return { result: 'success' };
      });

      // Enqueue 5 jobs
      for (let i = 0; i < 5; i++) {
        queue.enqueue({ data: `test${i}` });
      }

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(maxConcurrentJobs).toBeLessThanOrEqual(2);
      expect(queue.getCompletedCount()).toBe(5);
    });
  });

  describe('retry logic', () => {
    test('should retry failed jobs', async () => {
      let attempts = 0;

      queue.setProcessor(async (job) => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Processing failed');
        }
        return { result: 'success' };
      });

      const job = queue.enqueue({ data: 'test' });

      // Wait for retries
      await new Promise(resolve => setTimeout(resolve, 500));

      const finalJob = queue.getJob(job.id);
      expect(finalJob?.status).toBe(JobStatus.COMPLETED);
      expect(finalJob?.retryCount).toBe(2);
      expect(attempts).toBe(3);
    });

    test('should fail job after retry limit', async () => {
      queue.setProcessor(async () => {
        throw new Error('Always fails');
      });

      const job = queue.enqueue({ data: 'test' });

      // Wait for retries
      await new Promise(resolve => setTimeout(resolve, 1000));

      const finalJob = queue.getJob(job.id);
      expect(finalJob?.status).toBe(JobStatus.FAILED);
      expect(finalJob?.retryCount).toBe(2);
      expect(finalJob?.error).toBe('Always fails');
    });
  });

  describe('job retrieval', () => {
    test('should retrieve job by id', async () => {
      const job1 = queue.enqueue({ data: 'test1' });
      const job2 = queue.enqueue({ data: 'test2' });

      expect(queue.getJob(job1.id)).toEqual(job1);
      expect(queue.getJob(job2.id)).toEqual(job2);
      expect(queue.getJob('non-existent')).toBeUndefined();
    });
  });

  describe('queue management', () => {
    test('should clear completed jobs', async () => {
      queue.setProcessor(async () => ({ result: 'success' }));

      queue.enqueue({ data: 'test1' });
      queue.enqueue({ data: 'test2' });

      await new Promise(resolve => setTimeout(resolve, 200));

      expect(queue.getCompletedCount()).toBe(2);
      
      queue.clearCompleted();
      expect(queue.getCompletedCount()).toBe(0);
    });

    test('should clear failed jobs', async () => {
      queue.setProcessor(async () => {
        throw new Error('Always fails');
      });

      queue.enqueue({ data: 'test1' });
      queue.enqueue({ data: 'test2' });

      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(queue.getFailedCount()).toBe(2);
      
      queue.clearFailed();
      expect(queue.getFailedCount()).toBe(0);
    });
  });
});