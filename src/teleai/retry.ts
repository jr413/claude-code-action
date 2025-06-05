interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  shouldRetry?: (error: any) => boolean
}

export class RetryHandler {
  private readonly maxRetries: number
  private readonly initialDelay: number
  private readonly maxDelay: number
  private readonly backoffMultiplier: number
  private readonly shouldRetry: (error: any) => boolean

  constructor(options: RetryOptions = {}) {
    this.maxRetries = options.maxRetries ?? 3
    this.initialDelay = options.initialDelay ?? 1000
    this.maxDelay = options.maxDelay ?? 30000
    this.backoffMultiplier = options.backoffMultiplier ?? 2
    this.shouldRetry = options.shouldRetry ?? this.defaultShouldRetry
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: any
    let delay = this.initialDelay

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error

        if (attempt === this.maxRetries || !this.shouldRetry(error)) {
          throw error
        }

        await this.sleep(delay)
        delay = Math.min(delay * this.backoffMultiplier, this.maxDelay)
      }
    }

    throw lastError
  }

  private defaultShouldRetry(error: any): boolean {
    if (error.statusCode) {
      // Retry on 5xx errors and specific 4xx errors
      return error.statusCode >= 500 || error.statusCode === 429 || error.statusCode === 408
    }
    
    // Retry on network errors
    if (error.code) {
      const retryCodes = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ENETUNREACH']
      return retryCodes.includes(error.code)
    }

    return false
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}