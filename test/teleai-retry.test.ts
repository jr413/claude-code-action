import { describe, test, expect, beforeEach } from 'bun:test'
import { RetryHandler } from '../src/teleai/retry'

describe('RetryHandler', () => {
  let retryHandler: RetryHandler

  beforeEach(() => {
    retryHandler = new RetryHandler({
      maxRetries: 3,
      initialDelay: 100,
      maxDelay: 1000,
      backoffMultiplier: 2
    })
  })

  test('should execute function successfully on first try', async () => {
    let attempts = 0
    const result = await retryHandler.execute(async () => {
      attempts++
      return 'success'
    })
    
    expect(result).toBe('success')
    expect(attempts).toBe(1)
  })

  test('should retry on failure and eventually succeed', async () => {
    let attempts = 0
    const result = await retryHandler.execute(async () => {
      attempts++
      if (attempts < 3) {
        const error: any = new Error('Temporary failure')
        error.statusCode = 500
        throw error
      }
      return 'success'
    })
    
    expect(result).toBe('success')
    expect(attempts).toBe(3)
  })

  test('should throw error after max retries', async () => {
    let attempts = 0
    await expect(retryHandler.execute(async () => {
      attempts++
      const error: any = new Error('Persistent failure')
      error.statusCode = 500
      throw error
    })).rejects.toThrow('Persistent failure')
    
    expect(attempts).toBe(4) // initial + 3 retries
  })

  test('should not retry on non-retryable errors', async () => {
    let attempts = 0
    await expect(retryHandler.execute(async () => {
      attempts++
      const error: any = new Error('Bad request')
      error.statusCode = 400
      throw error
    })).rejects.toThrow('Bad request')
    
    expect(attempts).toBe(1)
  })

  test('should retry on specific status codes', async () => {
    const testCases = [
      { statusCode: 429, shouldRetry: true },
      { statusCode: 408, shouldRetry: true },
      { statusCode: 500, shouldRetry: true },
      { statusCode: 503, shouldRetry: true },
      { statusCode: 400, shouldRetry: false },
      { statusCode: 401, shouldRetry: false },
      { statusCode: 404, shouldRetry: false }
    ]

    for (const { statusCode, shouldRetry } of testCases) {
      let attempts = 0
      const handler = new RetryHandler({ maxRetries: 1, initialDelay: 10 })
      
      try {
        await handler.execute(async () => {
          attempts++
          const error: any = new Error(`Error ${statusCode}`)
          error.statusCode = statusCode
          throw error
        })
      } catch {
        // Expected to throw
      }
      
      expect(attempts).toBe(shouldRetry ? 2 : 1)
    }
  })

  test('should retry on network errors', async () => {
    const networkErrors = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ENETUNREACH']
    
    for (const code of networkErrors) {
      let attempts = 0
      const handler = new RetryHandler({ maxRetries: 1, initialDelay: 10 })
      
      try {
        await handler.execute(async () => {
          attempts++
          const error: any = new Error(`Network error: ${code}`)
          error.code = code
          throw error
        })
      } catch {
        // Expected to throw
      }
      
      expect(attempts).toBe(2)
    }
  })

  test('should apply exponential backoff', async () => {
    const delays: number[] = []
    let lastTime = Date.now()
    
    const handler = new RetryHandler({
      maxRetries: 3,
      initialDelay: 100,
      backoffMultiplier: 2
    })
    
    try {
      await handler.execute(async () => {
        const now = Date.now()
        if (lastTime) {
          delays.push(now - lastTime)
        }
        lastTime = now
        const error: any = new Error('Failure')
        error.statusCode = 500
        throw error
      })
    } catch {
      // Expected to throw
    }
    
    // First retry after ~100ms, second after ~200ms, third after ~400ms
    expect(delays[1]).toBeGreaterThanOrEqual(90)
    expect(delays[1]).toBeLessThan(150)
    expect(delays[2]).toBeGreaterThanOrEqual(180)
    expect(delays[2]).toBeLessThan(250)
    expect(delays[3]).toBeGreaterThanOrEqual(380)
    expect(delays[3]).toBeLessThan(450)
  })
})