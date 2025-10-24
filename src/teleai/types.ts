export interface TeleAIConfig {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
}

export interface TranscribeRequest {
  audio: string | Buffer;
  language?: string;
  format?: 'json' | 'text';
}

export interface TranscribeResponse {
  text: string;
  language?: string;
  confidence?: number;
  segments?: Array<{
    text: string;
    start: number;
    end: number;
  }>;
}

export interface SentimentAnalysisRequest {
  text: string;
  language?: string;
}

export interface SentimentAnalysisResponse {
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  confidence: number;
  scores: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

export interface ExtractSummaryRequest {
  text: string;
  maxLength?: number;
  language?: string;
}

export interface ExtractSummaryResponse {
  summary: string;
  keyPoints?: string[];
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  services: {
    [key: string]: {
      status: 'up' | 'down';
      latency?: number;
    };
  };
}

export class TeleAIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'TeleAIError';
  }
}

export class RateLimitError extends TeleAIError {
  constructor(public retryAfter?: number) {
    super('Rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

export class AuthenticationError extends TeleAIError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_FAILED');
    this.name = 'AuthenticationError';
  }
}