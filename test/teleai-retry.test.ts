import { describe, test, expect, beforeEach } from 'bun:test';
import { withRetry, createRetryConfig } from '../src/teleai/retry';
import { TeleAIError } from '../src/teleai/types';

describe('Retry Logic', () => {
  describe('withRetry', () => {
    test('should return successful result without retry', async () => {
      const fn = async () => 'success';
      const config = createRetryConfig(3, 10, 100);
      
      const result = await withRetry(fn, config);
      expect(result).toBe('success');
    });

    test('should retry on failure and eventually succeed', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      };
      
      const config = createRetryConfig(3, 10, 100);
      const result = await withRetry(fn, config);
      
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    test('should throw after max retries', async () => {
      const fn = async () => {
        throw new Error('Persistent failure');
      };
      
      const config = createRetryConfig(2, 10, 100);
      
      await expect(withRetry(fn, config)).rejects.toThrow('Persistent failure');
    });

    test('should not retry on 4xx errors', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        throw new TeleAIError('Bad request', 400);
      };
      
      const config = createRetryConfig(3, 10, 100);
      
      await expect(withRetry(fn, config)).rejects.toThrow(TeleAIError);
      expect(attempts).toBe(1); // Should not retry
    });

    test('should retry on 5xx errors', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts < 3) {
          throw new TeleAIError('Server error', 500);
        }
        return 'success';
      };
      
      const config = createRetryConfig(3, 10, 100);
      const result = await withRetry(fn, config);
      
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    test('should use custom shouldRetry function', async () => {
      let attempts = 0;
      const fn = async () => {
        attempts++;
        throw new Error('Custom error');
      };
      
      const config = createRetryConfig(3, 10, 100);
      const shouldRetry = (error: any) => error.message === 'Custom error' && attempts < 2;
      
      await expect(withRetry(fn, config, shouldRetry)).rejects.toThrow('Custom error');
      expect(attempts).toBe(2);
    });

    test('should implement exponential backoff', async () => {
      const delays: number[] = [];
      let lastCallTime = Date.now();
      
      const fn = async () => {
        const now = Date.now();
        delays.push(now - lastCallTime);
        lastCallTime = now;
        throw new Error('Failure');
      };
      
      const config = createRetryConfig(3, 100, 1000);
      
      try {
        await withRetry(fn, config);
      } catch {
        // Expected to fail
      }
      
      // First call should be immediate
      expect(delays[0]).toBeLessThan(50);
      
      // Subsequent calls should have increasing delays
      expect(delays[1]).toBeGreaterThanOrEqual(90); // ~100ms
      expect(delays[2]).toBeGreaterThanOrEqual(180); // ~200ms
      expect(delays[3]).toBeGreaterThanOrEqual(380); // ~400ms
    });
  });

  describe('createRetryConfig', () => {
    test('should create config with default values', () => {
      const config = createRetryConfig();
      expect(config).toEqual({
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000
      });
    });

    test('should create config with custom values', () => {
      const config = createRetryConfig(5, 500, 5000);
      expect(config).toEqual({
        maxRetries: 5,
        initialDelayMs: 500,
        maxDelayMs: 5000
      });
    });
  });
});