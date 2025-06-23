/**
 * TeleAI APIクライアント実装
 */

import {
  TeleAIConfig,
  TranscribeRequest,
  TranscribeResponse,
  AnalyzeSentimentRequest,
  AnalyzeSentimentResponse,
  ExtractSummaryRequest,
  ExtractSummaryResponse,
  HealthResponse,
  TeleAIError,
  RateLimitInfo,
} from './types';
import { RateLimiter } from './rate-limiter';
import { RetryHandler } from './retry-handler';

export class TeleAIClient {
  private readonly config: Required<TeleAIConfig>;
  private readonly rateLimiter: RateLimiter;
  private readonly retryHandler: RetryHandler;

  constructor(config: TeleAIConfig) {
    // デフォルト値を設定
    this.config = {
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      timeout: config.timeout ?? 30000, // 30秒
      rateLimit: config.rateLimit ?? 100, // 100リクエスト/分
      maxRetries: config.maxRetries ?? 3,
    };

    // レート制限を初期化
    this.rateLimiter = new RateLimiter(this.config.rateLimit, 60000);

    // リトライハンドラーを初期化
    this.retryHandler = new RetryHandler({
      maxRetries: this.config.maxRetries,
      initialDelay: 1000,
      maxDelay: 32000,
      backoffFactor: 2,
    });

    // APIキーの検証
    if (!this.config.apiKey) {
      throw new Error('TeleAI APIキーが設定されていません');
    }

    // ベースURLの正規化
    if (!this.config.baseUrl.endsWith('/')) {
      this.config.baseUrl += '/';
    }
  }

  /**
   * 音声を文字起こし
   * @param request - 文字起こしリクエスト
   * @returns 文字起こし結果
   */
  async transcribe(request: TranscribeRequest): Promise<TranscribeResponse> {
    return this.executeRequest<TranscribeResponse>(
      'transcribe',
      request,
      '音声文字起こし'
    );
  }

  /**
   * テキストの感情分析
   * @param request - 感情分析リクエスト
   * @returns 感情分析結果
   */
  async analyzeSentiment(request: AnalyzeSentimentRequest): Promise<AnalyzeSentimentResponse> {
    return this.executeRequest<AnalyzeSentimentResponse>(
      'analyze-sentiment',
      request,
      '感情分析'
    );
  }

  /**
   * テキストの要約抽出
   * @param request - 要約抽出リクエスト
   * @returns 要約結果
   */
  async extractSummary(request: ExtractSummaryRequest): Promise<ExtractSummaryResponse> {
    return this.executeRequest<ExtractSummaryResponse>(
      'extract-summary',
      request,
      '要約抽出'
    );
  }

  /**
   * ヘルスチェック
   * @returns ヘルスチェック結果
   */
  async health(): Promise<HealthResponse> {
    return this.executeRequest<HealthResponse>(
      'health',
      undefined,
      'ヘルスチェック',
      'GET'
    );
  }

  /**
   * レート制限情報を取得
   * @returns レート制限情報
   */
  getRateLimitInfo(): RateLimitInfo {
    return this.rateLimiter.getRateLimitInfo();
  }

  /**
   * APIリクエストを実行
   * @param endpoint - エンドポイント
   * @param data - リクエストデータ
   * @param context - コンテキスト（ログ用）
   * @param method - HTTPメソッド
   * @returns レスポンスデータ
   */
  private async executeRequest<T>(
    endpoint: string,
    data: any,
    context: string,
    method: string = 'POST'
  ): Promise<T> {
    // レート制限チェック
    await this.rateLimiter.waitIfNeeded();

    return this.retryHandler.execute(async () => {
      // レート制限を記録
      this.rateLimiter.recordRequest();

      const url = `${this.config.baseUrl}${endpoint}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      try {
        const options: RequestInit = {
          method,
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'TeleAI-Client/1.0.0',
          },
          signal: controller.signal,
        };

        if (data && method !== 'GET') {
          options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);

        // レスポンスのレート制限ヘッダーを処理
        this.updateRateLimitFromHeaders(response.headers);

        if (!response.ok) {
          const error = await this.parseErrorResponse(response);
          throw error;
        }

        const result = await response.json();
        return result as T;
      } catch (error: any) {
        if (error.name === 'AbortError') {
          throw new Error(`${context}がタイムアウトしました（${this.config.timeout / 1000}秒）`);
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    }, context);
  }

  /**
   * エラーレスポンスを解析
   * @param response - HTTPレスポンス
   * @returns エラーオブジェクト
   */
  private async parseErrorResponse(response: Response): Promise<Error> {
    let errorData: TeleAIError;

    try {
      errorData = await response.json();
    } catch {
      errorData = {
        code: 'UNKNOWN_ERROR',
        message: `HTTPエラー: ${response.status} ${response.statusText}`,
      };
    }

    const error = new Error(errorData.message || 'APIエラーが発生しました');
    (error as any).status = response.status;
    (error as any).code = errorData.code;
    (error as any).details = errorData.details;
    (error as any).retryable = errorData.retryable;
    (error as any).retryAfter = errorData.retryAfter;
    (error as any).headers = response.headers;

    return error;
  }

  /**
   * レスポンスヘッダーからレート制限情報を更新
   * @param headers - レスポンスヘッダー
   */
  private updateRateLimitFromHeaders(headers: Headers): void {
    // 一般的なレート制限ヘッダーを確認
    const remaining = headers.get('X-RateLimit-Remaining');
    const reset = headers.get('X-RateLimit-Reset');

    if (remaining || reset) {
      console.log(`レート制限情報 - 残り: ${remaining}, リセット: ${reset ? new Date(parseInt(reset) * 1000).toLocaleString('ja-JP') : 'N/A'}`);
    }
  }
}