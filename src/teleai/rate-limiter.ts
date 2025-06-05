export class RateLimiter {
  private requests: number[] = []
  private readonly limit: number
  private readonly windowMs: number

  constructor(limit: number = 100, windowMs: number = 60000) {
    this.limit = limit
    this.windowMs = windowMs
  }

  async checkLimit(): Promise<boolean> {
    const now = Date.now()
    this.requests = this.requests.filter(time => now - time < this.windowMs)
    
    if (this.requests.length >= this.limit) {
      return false
    }
    
    this.requests.push(now)
    return true
  }

  async waitForSlot(): Promise<void> {
    while (!(await this.checkLimit())) {
      const oldestRequest = this.requests[0]
      const waitTime = this.windowMs - (Date.now() - oldestRequest) + 100
      await new Promise(resolve => setTimeout(resolve, Math.max(waitTime, 100)))
    }
  }

  getRemainingRequests(): number {
    const now = Date.now()
    this.requests = this.requests.filter(time => now - time < this.windowMs)
    return Math.max(0, this.limit - this.requests.length)
  }

  getResetTime(): Date {
    if (this.requests.length === 0) {
      return new Date()
    }
    const oldestRequest = this.requests[0]
    return new Date(oldestRequest + this.windowMs)
  }

  reset(): void {
    this.requests = []
  }
}