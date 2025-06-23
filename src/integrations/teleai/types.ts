/**
 * TeleAI API統合の型定義
 */

/**
 * TeleAI API設定
 */
export interface TeleAIConfig {
  /** API ベースURL */
  baseUrl: string;
  /** APIキー (Bearer token) */
  apiKey: string;
  /** タイムアウト設定（ミリ秒） */
  timeout?: number;
  /** レート制限（リクエスト/分） */
  rateLimit?: number;
  /** リトライ最大回数 */
  maxRetries?: number;
}

/**
 * 音声文字起こしリクエスト
 */
export interface TranscribeRequest {
  /** 音声データ（Base64エンコード） */
  audio: string;
  /** 音声フォーマット */
  format?: 'mp3' | 'wav' | 'ogg' | 'webm';
  /** 言語コード */
  language?: string;
}

/**
 * 音声文字起こしレスポンス
 */
export interface TranscribeResponse {
  /** 文字起こし結果 */
  text: string;
  /** 検出された言語 */
  detectedLanguage?: string;
  /** 信頼度スコア */
  confidence?: number;
  /** 処理時間（ミリ秒） */
  processingTime?: number;
}

/**
 * 感情分析リクエスト
 */
export interface AnalyzeSentimentRequest {
  /** 分析対象のテキスト */
  text: string;
  /** 言語コード */
  language?: string;
}

/**
 * 感情分析レスポンス
 */
export interface AnalyzeSentimentResponse {
  /** 感情スコア（-1.0〜1.0、負が否定的、正が肯定的） */
  score: number;
  /** 感情ラベル */
  label: 'positive' | 'negative' | 'neutral';
  /** 詳細な感情分析 */
  emotions?: {
    joy?: number;
    sadness?: number;
    anger?: number;
    fear?: number;
    surprise?: number;
    disgust?: number;
  };
  /** 信頼度スコア */
  confidence: number;
}

/**
 * 要約抽出リクエスト
 */
export interface ExtractSummaryRequest {
  /** 要約対象のテキスト */
  text: string;
  /** 最大要約長（文字数） */
  maxLength?: number;
  /** 要約タイプ */
  type?: 'extractive' | 'abstractive';
  /** 言語コード */
  language?: string;
}

/**
 * 要約抽出レスポンス
 */
export interface ExtractSummaryResponse {
  /** 要約結果 */
  summary: string;
  /** キーポイント */
  keyPoints?: string[];
  /** 抽出されたキーワード */
  keywords?: string[];
  /** 処理時間（ミリ秒） */
  processingTime?: number;
}

/**
 * ヘルスチェックレスポンス
 */
export interface HealthResponse {
  /** サービスステータス */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** バージョン情報 */
  version: string;
  /** アップタイム（秒） */
  uptime: number;
  /** タイムスタンプ */
  timestamp: string;
  /** 各サービスの状態 */
  services?: {
    transcribe?: 'up' | 'down';
    sentiment?: 'up' | 'down';
    summary?: 'up' | 'down';
  };
}

/**
 * APIエラーレスポンス
 */
export interface TeleAIError {
  /** エラーコード */
  code: string;
  /** エラーメッセージ */
  message: string;
  /** 詳細情報 */
  details?: any;
  /** リトライ可能かどうか */
  retryable?: boolean;
  /** リトライまでの待機時間（秒） */
  retryAfter?: number;
}

/**
 * レート制限情報
 */
export interface RateLimitInfo {
  /** 残りリクエスト数 */
  remaining: number;
  /** リセット時刻（UNIXタイムスタンプ） */
  reset: number;
  /** 制限値 */
  limit: number;
}