import type { RetryOptions } from './types';

export class RetryHandler {
  private options: RetryOptions;

  constructor(options: Partial<RetryOptions> = {}) {
    this.options = {
      retries: options.retries ?? 3,
      factor: options.factor ?? 2,
      minTimeout: options.minTimeout ?? 1000,
      maxTimeout: options.maxTimeout ?? 30000,
    };
  }

  async execute<T>(
    fn: () => Promise<T>,
    isRetryableError: (error: unknown) => boolean = () => true
  ): Promise<T> {
    let lastError: unknown;
    
    for (let attempt = 0; attempt <= this.options.retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === this.options.retries || !isRetryableError(error)) {
          throw error;
        }
        
        const delay = this.calculateDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  private calculateDelay(attempt: number): number {
    const exponentialDelay = this.options.minTimeout * Math.pow(this.options.factor, attempt);
    const jitteredDelay = exponentialDelay * (0.5 + Math.random() * 0.5);
    return Math.min(jitteredDelay, this.options.maxTimeout);
  }
}