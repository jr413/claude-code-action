import { describe, it, expect, beforeEach } from 'bun:test';
import { RetryHandler } from '../../src/teleai/retry-handler';

describe('RetryHandler', () => {
  let retryHandler: RetryHandler;
  
  beforeEach(() => {
    retryHandler = new RetryHandler({
      retries: 3,
      factor: 2,
      minTimeout: 100,
      maxTimeout: 1000,
    });
  });

  it('should return successful result without retry', async () => {
    let attempts = 0;
    const result = await retryHandler.execute(async () => {
      attempts++;
      return 'success';
    });
    
    expect(result).toBe('success');
    expect(attempts).toBe(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    let attempts = 0;
    const result = await retryHandler.execute(async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('temporary failure');
      }
      return 'success';
    });
    
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  it('should throw error after max retries', async () => {
    let attempts = 0;
    
    await expect(
      retryHandler.execute(async () => {
        attempts++;
        throw new Error('permanent failure');
      })
    ).rejects.toThrow('permanent failure');
    
    expect(attempts).toBe(4);
  });

  it('should not retry if error is not retryable', async () => {
    let attempts = 0;
    
    await expect(
      retryHandler.execute(
        async () => {
          attempts++;
          throw new Error('non-retryable');
        },
        (error) => false
      )
    ).rejects.toThrow('non-retryable');
    
    expect(attempts).toBe(1);
  });

  it('should apply exponential backoff with jitter', async () => {
    const delays: number[] = [];
    let lastTime = Date.now();
    
    await expect(
      retryHandler.execute(async () => {
        const now = Date.now();
        if (lastTime !== now) {
          delays.push(now - lastTime);
          lastTime = now;
        }
        throw new Error('failure');
      })
    ).rejects.toThrow();
    
    expect(delays.length).toBe(3);
    expect(delays[0]).toBeGreaterThanOrEqual(50);
    expect(delays[0]).toBeLessThanOrEqual(150);
    expect(delays[1]).toBeGreaterThanOrEqual(100);
    expect(delays[1]).toBeLessThanOrEqual(300);
    expect(delays[2]).toBeGreaterThanOrEqual(200);
    expect(delays[2]).toBeLessThanOrEqual(600);
  });
});