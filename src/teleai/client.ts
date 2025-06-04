import {
  TeleAIConfig,
  TranscribeRequest,
  TranscribeResponse,
  SentimentAnalysisRequest,
  SentimentAnalysisResponse,
  ExtractSummaryRequest,
  ExtractSummaryResponse,
  HealthResponse,
  TeleAIError,
  AuthenticationError
} from './types';
import { TeleAIAuth } from './auth';
import { RateLimiter } from './rate-limiter';
import { withRetry, createRetryConfig } from './retry';

export class TeleAIClient {
  private auth: TeleAIAuth;
  private config: TeleAIConfig;
  private rateLimiter: RateLimiter;
  private retryConfig = createRetryConfig();

  constructor(config: TeleAIConfig) {
    this.config = {
      ...config,
      timeout: config.timeout || 30000 // Default 30 seconds
    };
    
    this.auth = new TeleAIAuth(config.apiKey);
    this.rateLimiter = new RateLimiter({
      maxRequests: 100,
      windowMs: 60 * 1000 // 1 minute
    });
  }

  private async request<T>(
    endpoint: string,
    method: string = 'POST',
    body?: any
  ): Promise<T> {
    // Check rate limit
    await this.rateLimiter.checkLimit();

    return withRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      try {
        const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
          method,
          headers: this.auth.getHeaders(),
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorBody = await response.text();
          let errorData: any;
          
          try {
            errorData = JSON.parse(errorBody);
          } catch {
            errorData = { message: errorBody };
          }

          if (response.status === 401) {
            throw new AuthenticationError(errorData.message || 'Authentication failed');
          }

          throw new TeleAIError(
            errorData.message || `Request failed with status ${response.status}`,
            response.status,
            errorData.code,
            errorData
          );
        }

        return response.json();
      } catch (error: any) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          throw new TeleAIError('Request timeout', undefined, 'TIMEOUT');
        }
        
        if (error instanceof TeleAIError) {
          throw error;
        }
        
        throw new TeleAIError(
          error.message || 'Network error',
          undefined,
          'NETWORK_ERROR'
        );
      }
    }, this.retryConfig);
  }

  async transcribe(request: TranscribeRequest): Promise<TranscribeResponse> {
    return this.request<TranscribeResponse>('/transcribe', 'POST', request);
  }

  async analyzeSentiment(request: SentimentAnalysisRequest): Promise<SentimentAnalysisResponse> {
    return this.request<SentimentAnalysisResponse>('/analyze-sentiment', 'POST', request);
  }

  async extractSummary(request: ExtractSummaryRequest): Promise<ExtractSummaryResponse> {
    return this.request<ExtractSummaryResponse>('/extract-summary', 'POST', request);
  }

  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health', 'GET');
  }

  getRateLimitInfo() {
    return {
      remaining: this.rateLimiter.getRemaining(),
      limit: 100,
      windowMs: 60000
    };
  }
}