import { RateLimitConfig, RateLimitError } from './types';

export class RateLimiter {
  private requests: number[] = [];
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async checkLimit(): Promise<void> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Remove old requests outside the window
    this.requests = this.requests.filter(timestamp => timestamp > windowStart);

    if (this.requests.length >= this.config.maxRequests) {
      const oldestRequest = this.requests[0];
      const retryAfter = Math.ceil((oldestRequest + this.config.windowMs - now) / 1000);
      throw new RateLimitError(retryAfter);
    }

    // Add current request
    this.requests.push(now);
  }

  reset(): void {
    this.requests = [];
  }

  getRemaining(): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    this.requests = this.requests.filter(timestamp => timestamp > windowStart);
    return Math.max(0, this.config.maxRequests - this.requests.length);
  }
}