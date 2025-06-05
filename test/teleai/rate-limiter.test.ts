import { describe, it, expect, beforeEach } from 'bun:test';
import { RateLimiter } from '../../src/teleai/rate-limiter';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;
  
  beforeEach(() => {
    rateLimiter = new RateLimiter({
      maxRequests: 3,
      windowMs: 1000,
    });
  });

  it('should allow requests within limit', async () => {
    const start = Date.now();
    
    await rateLimiter.waitIfNeeded();
    await rateLimiter.waitIfNeeded();
    await rateLimiter.waitIfNeeded();
    
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  it('should delay when limit is exceeded', async () => {
    const start = Date.now();
    
    await rateLimiter.waitIfNeeded();
    await rateLimiter.waitIfNeeded();
    await rateLimiter.waitIfNeeded();
    await rateLimiter.waitIfNeeded();
    
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(900);
  });

  it('should reset requests', async () => {
    await rateLimiter.waitIfNeeded();
    await rateLimiter.waitIfNeeded();
    await rateLimiter.waitIfNeeded();
    
    rateLimiter.reset();
    
    const start = Date.now();
    await rateLimiter.waitIfNeeded();
    const elapsed = Date.now() - start;
    
    expect(elapsed).toBeLessThan(100);
  });

  it('should allow new requests after window expires', async () => {
    await rateLimiter.waitIfNeeded();
    await rateLimiter.waitIfNeeded();
    await rateLimiter.waitIfNeeded();
    
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    const start = Date.now();
    await rateLimiter.waitIfNeeded();
    const elapsed = Date.now() - start;
    
    expect(elapsed).toBeLessThan(100);
  });
});