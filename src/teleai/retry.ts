import { RetryConfig, TeleAIError } from './types';

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig,
  shouldRetry?: (error: any) => boolean
): Promise<T> {
  let lastError: any;
  let delay = config.initialDelayMs;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt === config.maxRetries) {
        break;
      }

      // Default retry logic: retry on network errors and 5xx status codes
      const defaultShouldRetry = (err: any) => {
        if (err instanceof TeleAIError) {
          return err.statusCode === undefined || err.statusCode >= 500;
        }
        return true; // Retry on unknown errors
      };

      const shouldRetryFn = shouldRetry || defaultShouldRetry;
      if (!shouldRetryFn(error)) {
        throw error;
      }

      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase delay for next attempt (exponential backoff)
      delay = Math.min(delay * 2, config.maxDelayMs);
    }
  }

  throw lastError;
}

export function createRetryConfig(
  maxRetries = 3,
  initialDelayMs = 1000,
  maxDelayMs = 10000
): RetryConfig {
  return {
    maxRetries,
    initialDelayMs,
    maxDelayMs
  };
}