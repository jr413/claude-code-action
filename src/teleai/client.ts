import fetch from 'node-fetch';
import { RateLimiter } from './rate-limiter';
import { RetryHandler } from './retry-handler';
import type {
  TeleAIConfig,
  TranscribeRequest,
  TranscribeResponse,
  AnalyzeSentimentRequest,
  AnalyzeSentimentResponse,
  ExtractSummaryRequest,
  ExtractSummaryResponse,
  HealthResponse,
  APIError,
} from './types';

export class TeleAIClient {
  private config: TeleAIConfig;
  private rateLimiter: RateLimiter;
  private retryHandler: RetryHandler;

  constructor(config: TeleAIConfig) {
    this.config = {
      timeout: 30000,
      maxRetries: 3,
      ...config,
    };

    this.rateLimiter = new RateLimiter({
      maxRequests: 100,
      windowMs: 60 * 1000,
    });

    this.retryHandler = new RetryHandler({
      retries: this.config.maxRetries,
      factor: 2,
      minTimeout: 1000,
      maxTimeout: 30000,
    });
  }

  async transcribe(request: TranscribeRequest): Promise<TranscribeResponse> {
    return this.makeRequest<TranscribeResponse>('/transcribe', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async analyzeSentiment(request: AnalyzeSentimentRequest): Promise<AnalyzeSentimentResponse> {
    return this.makeRequest<AnalyzeSentimentResponse>('/analyze-sentiment', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async extractSummary(request: ExtractSummaryRequest): Promise<ExtractSummaryResponse> {
    return this.makeRequest<ExtractSummaryResponse>('/extract-summary', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async checkHealth(): Promise<HealthResponse> {
    return this.makeRequest<HealthResponse>('/health', {
      method: 'GET',
    });
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
    await this.rateLimiter.waitIfNeeded();

    return this.retryHandler.execute(
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        try {
          const response = await fetch(`${this.config.apiBaseUrl}${endpoint}`, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.config.bearerToken}`,
              ...options.headers,
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const error = await this.parseErrorResponse(response);
            throw error;
          }

          return await response.json() as T;
        } catch (error) {
          clearTimeout(timeoutId);
          
          if (error instanceof Error && error.name === 'AbortError') {
            throw this.createAPIError('TIMEOUT', 'Request timed out', 408);
          }
          
          throw error;
        }
      },
      (error) => this.isRetryableError(error)
    );
  }

  private async parseErrorResponse(response: Response): Promise<APIError> {
    try {
      const errorData = await response.json();
      return {
        code: errorData.code || 'UNKNOWN_ERROR',
        message: errorData.message || 'An error occurred',
        statusCode: response.status,
        details: errorData.details,
      };
    } catch {
      return this.createAPIError(
        'HTTP_ERROR',
        `HTTP ${response.status}: ${response.statusText}`,
        response.status
      );
    }
  }

  private createAPIError(code: string, message: string, statusCode: number): APIError {
    return { code, message, statusCode };
  }

  private isRetryableError(error: unknown): boolean {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const statusCode = (error as APIError).statusCode;
      return statusCode === 408 || statusCode === 429 || statusCode >= 500;
    }
    return true;
  }
}