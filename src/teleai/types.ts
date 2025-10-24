export interface TeleAIConfig {
  apiBaseUrl: string;
  bearerToken: string;
  timeout?: number;
  maxRetries?: number;
}

export interface RateLimiterConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RetryOptions {
  retries: number;
  factor: number;
  minTimeout: number;
  maxTimeout: number;
}

export interface TranscribeRequest {
  audio: string | Buffer;
  language?: string;
}

export interface TranscribeResponse {
  text: string;
  confidence: number;
  duration: number;
}

export interface AnalyzeSentimentRequest {
  text: string;
  language?: string;
}

export interface AnalyzeSentimentResponse {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  emotions?: Record<string, number>;
}

export interface ExtractSummaryRequest {
  text: string;
  maxLength?: number;
  style?: 'bullets' | 'paragraph';
}

export interface ExtractSummaryResponse {
  summary: string;
  keyPoints: string[];
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  version: string;
  timestamp: string;
  services?: Record<string, 'up' | 'down'>;
}

export interface APIError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}