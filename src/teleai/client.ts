import type {
  TeleAIConfig,
  TranscribeRequest,
  TranscribeResponse,
  AnalyzeSentimentRequest,
  AnalyzeSentimentResponse,
  ExtractSummaryRequest,
  ExtractSummaryResponse,
  HealthResponse,
  TeleAIError,
  RateLimitInfo
} from './types'
import { TeleAIAuth } from './auth'
import { RateLimiter } from './rate-limiter'
import { RetryHandler } from './retry'

export class TeleAIClient {
  private readonly auth: TeleAIAuth
  private readonly rateLimiter: RateLimiter
  private readonly retryHandler: RetryHandler
  private readonly baseUrl: string
  private readonly timeout: number

  constructor(config: TeleAIConfig) {
    this.auth = new TeleAIAuth(config)
    this.rateLimiter = new RateLimiter(100, 60000) // 100 requests per minute
    this.retryHandler = new RetryHandler({ maxRetries: config.maxRetries ?? 3 })
    this.baseUrl = config.baseUrl || 'https://teleai-pro-api.onrender.com'
    this.timeout = config.timeout || 30000
  }

  async transcribe(request: TranscribeRequest): Promise<TranscribeResponse> {
    return this.makeRequest<TranscribeResponse>('/transcribe', 'POST', request)
  }

  async analyzeSentiment(request: AnalyzeSentimentRequest): Promise<AnalyzeSentimentResponse> {
    return this.makeRequest<AnalyzeSentimentResponse>('/analyze-sentiment', 'POST', request)
  }

  async extractSummary(request: ExtractSummaryRequest): Promise<ExtractSummaryResponse> {
    return this.makeRequest<ExtractSummaryResponse>('/extract-summary', 'POST', request)
  }

  async health(): Promise<HealthResponse> {
    return this.makeRequest<HealthResponse>('/health', 'GET')
  }

  getRateLimitInfo(): RateLimitInfo {
    return {
      limit: 100,
      remaining: this.rateLimiter.getRemainingRequests(),
      reset: this.rateLimiter.getResetTime()
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    method: string,
    body?: any
  ): Promise<T> {
    await this.rateLimiter.waitForSlot()

    return this.retryHandler.execute(async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      try {
        const headers = await this.auth.getAuthHeaders()
        const url = `${this.baseUrl}${endpoint}`

        const options: RequestInit = {
          method,
          headers,
          signal: controller.signal
        }

        if (body && method !== 'GET') {
          options.body = JSON.stringify(body)
        }

        const response = await fetch(url, options)

        if (!response.ok) {
          throw this.createError(response.status, response.statusText, await response.text())
        }

        return await response.json() as T
      } finally {
        clearTimeout(timeoutId)
      }
    })
  }

  private createError(statusCode: number, statusText: string, responseBody: string): TeleAIError {
    let details: any = {}
    try {
      details = JSON.parse(responseBody)
    } catch {
      details = { message: responseBody }
    }

    const error = new Error(details.message || statusText) as TeleAIError
    error.code = details.code || `HTTP_${statusCode}`
    error.statusCode = statusCode
    error.details = details
    return error
  }
}