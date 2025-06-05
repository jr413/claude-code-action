export interface TeleAIConfig {
  apiKey: string
  baseUrl?: string
  timeout?: number
  maxRetries?: number
}

export interface TranscribeRequest {
  audio: Buffer | string
  language?: string
  format?: 'text' | 'json' | 'srt' | 'vtt'
}

export interface TranscribeResponse {
  text: string
  language?: string
  duration?: number
  words?: Array<{
    word: string
    start: number
    end: number
    confidence: number
  }>
}

export interface AnalyzeSentimentRequest {
  text: string
  language?: string
}

export interface AnalyzeSentimentResponse {
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed'
  confidence: number
  scores: {
    positive: number
    negative: number
    neutral: number
  }
}

export interface ExtractSummaryRequest {
  text: string
  maxLength?: number
  style?: 'bullets' | 'paragraph'
}

export interface ExtractSummaryResponse {
  summary: string
  keyPoints?: string[]
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  version: string
  uptime: number
  services: Record<string, {
    status: 'operational' | 'degraded' | 'down'
    latency?: number
  }>
}

export interface TeleAIError extends Error {
  code: string
  statusCode?: number
  details?: unknown
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: Date
}