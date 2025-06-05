import { describe, test, expect, beforeEach } from 'bun:test'
import { RateLimiter } from '../src/teleai/rate-limiter'

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter

  beforeEach(() => {
    rateLimiter = new RateLimiter(5, 1000) // 5 requests per second for testing
  })

  test('should allow requests within limit', async () => {
    for (let i = 0; i < 5; i++) {
      const allowed = await rateLimiter.checkLimit()
      expect(allowed).toBe(true)
    }
  })

  test('should block requests when limit is exceeded', async () => {
    // Fill up the limit
    for (let i = 0; i < 5; i++) {
      await rateLimiter.checkLimit()
    }
    
    // Next request should be blocked
    const allowed = await rateLimiter.checkLimit()
    expect(allowed).toBe(false)
  })

  test('should get remaining requests correctly', async () => {
    expect(rateLimiter.getRemainingRequests()).toBe(5)
    
    await rateLimiter.checkLimit()
    expect(rateLimiter.getRemainingRequests()).toBe(4)
    
    await rateLimiter.checkLimit()
    expect(rateLimiter.getRemainingRequests()).toBe(3)
  })

  test('should reset requests after window expires', async () => {
    // Fill up the limit
    for (let i = 0; i < 5; i++) {
      await rateLimiter.checkLimit()
    }
    expect(rateLimiter.getRemainingRequests()).toBe(0)
    
    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 1100))
    
    // Should be able to make requests again
    expect(rateLimiter.getRemainingRequests()).toBe(5)
    const allowed = await rateLimiter.checkLimit()
    expect(allowed).toBe(true)
  })

  test('should wait for slot when using waitForSlot', async () => {
    // Fill up the limit
    for (let i = 0; i < 5; i++) {
      await rateLimiter.checkLimit()
    }
    
    // This should wait until a slot is available
    const start = Date.now()
    await rateLimiter.waitForSlot()
    const elapsed = Date.now() - start
    
    // Should have waited at least 1 second
    expect(elapsed).toBeGreaterThanOrEqual(1000)
  })

  test('should reset all requests when reset is called', async () => {
    for (let i = 0; i < 3; i++) {
      await rateLimiter.checkLimit()
    }
    expect(rateLimiter.getRemainingRequests()).toBe(2)
    
    rateLimiter.reset()
    expect(rateLimiter.getRemainingRequests()).toBe(5)
  })

  test('should get correct reset time', async () => {
    const before = Date.now()
    await rateLimiter.checkLimit()
    const resetTime = rateLimiter.getResetTime()
    
    expect(resetTime.getTime()).toBeGreaterThanOrEqual(before + 1000)
    expect(resetTime.getTime()).toBeLessThanOrEqual(before + 1100)
  })
})