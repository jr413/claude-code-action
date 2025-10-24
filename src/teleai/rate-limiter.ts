import type { RateLimiterConfig } from './types';

export class RateLimiter {
  private requests: number[] = [];
  private config: RateLimiterConfig;

  constructor(config: RateLimiterConfig) {
    this.config = config;
  }

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    this.requests = this.requests.filter(timestamp => timestamp > windowStart);
    
    if (this.requests.length >= this.config.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = oldestRequest + this.config.windowMs - now;
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.waitIfNeeded();
      }
    }
    
    this.requests.push(now);
  }

  reset(): void {
    this.requests = [];
  }
}