import { describe, test, expect, beforeEach } from 'bun:test';
import { RateLimiter } from '../src/teleai/rate-limiter';
import { RateLimitError } from '../src/teleai/types';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter({
      maxRequests: 3,
      windowMs: 1000 // 1 second window
    });
  });

  test('should allow requests within limit', async () => {
    await expect(rateLimiter.checkLimit()).resolves.toBeUndefined();
    await expect(rateLimiter.checkLimit()).resolves.toBeUndefined();
    await expect(rateLimiter.checkLimit()).resolves.toBeUndefined();
  });

  test('should throw RateLimitError when limit exceeded', async () => {
    await rateLimiter.checkLimit();
    await rateLimiter.checkLimit();
    await rateLimiter.checkLimit();
    
    await expect(rateLimiter.checkLimit()).rejects.toThrow(RateLimitError);
  });

  test('should reset window after time passes', async () => {
    await rateLimiter.checkLimit();
    await rateLimiter.checkLimit();
    await rateLimiter.checkLimit();
    
    // Wait for window to reset
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    await expect(rateLimiter.checkLimit()).resolves.toBeUndefined();
  });

  test('should return correct remaining requests', async () => {
    expect(rateLimiter.getRemaining()).toBe(3);
    
    await rateLimiter.checkLimit();
    expect(rateLimiter.getRemaining()).toBe(2);
    
    await rateLimiter.checkLimit();
    expect(rateLimiter.getRemaining()).toBe(1);
    
    await rateLimiter.checkLimit();
    expect(rateLimiter.getRemaining()).toBe(0);
  });

  test('should reset requests on reset()', async () => {
    await rateLimiter.checkLimit();
    await rateLimiter.checkLimit();
    expect(rateLimiter.getRemaining()).toBe(1);
    
    rateLimiter.reset();
    expect(rateLimiter.getRemaining()).toBe(3);
  });

  test('should calculate retry after correctly', async () => {
    await rateLimiter.checkLimit();
    await rateLimiter.checkLimit();
    await rateLimiter.checkLimit();
    
    try {
      await rateLimiter.checkLimit();
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitError);
      const rateLimitError = error as RateLimitError;
      expect(rateLimitError.retryAfter).toBeDefined();
      expect(rateLimitError.retryAfter).toBeGreaterThan(0);
      expect(rateLimitError.retryAfter).toBeLessThanOrEqual(1);
    }
  });
});