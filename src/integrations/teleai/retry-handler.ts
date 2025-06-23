/**
 * リトライ処理の実装（指数バックオフ）
 */

export interface RetryOptions {
  /** 最大リトライ回数 */
  maxRetries: number;
  /** 初期待機時間（ミリ秒） */
  initialDelay: number;
  /** 最大待機時間（ミリ秒） */
  maxDelay: number;
  /** バックオフ係数 */
  backoffFactor: number;
  /** リトライ可能なエラーを判定する関数 */
  isRetryable?: (error: any) => boolean;
}

export class RetryHandler {
  private readonly options: RetryOptions;

  constructor(options: Partial<RetryOptions> = {}) {
    this.options = {
      maxRetries: options.maxRetries ?? 3,
      initialDelay: options.initialDelay ?? 1000,
      maxDelay: options.maxDelay ?? 32000,
      backoffFactor: options.backoffFactor ?? 2,
      isRetryable: options.isRetryable ?? this.defaultIsRetryable,
    };
  }

  /**
   * リトライ機能付きで関数を実行
   * @param fn - 実行する関数
   * @param context - 実行コンテキスト（ログ用）
   * @returns 関数の実行結果
   */
  async execute<T>(
    fn: () => Promise<T>,
    context: string = '操作'
  ): Promise<T> {
    let lastError: any;
    let delay = this.options.initialDelay;

    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt === this.options.maxRetries) {
          console.error(`${context}が${this.options.maxRetries}回のリトライ後に失敗しました:`, error);
          throw error;
        }

        if (!this.options.isRetryable!(error)) {
          console.error(`${context}でリトライ不可能なエラーが発生しました:`, error);
          throw error;
        }

        // エラーレスポンスにretryAfterがある場合は、それを使用
        const retryAfter = this.getRetryAfter(error);
        const actualDelay = retryAfter ? retryAfter * 1000 : delay;

        console.log(
          `${context}が失敗しました（試行 ${attempt + 1}/${this.options.maxRetries + 1}）。` +
          `${(actualDelay / 1000).toFixed(1)}秒後にリトライします...`
        );

        await this.sleep(actualDelay);

        // 指数バックオフで次回の待機時間を計算
        delay = Math.min(delay * this.options.backoffFactor, this.options.maxDelay);
      }
    }

    throw lastError;
  }

  /**
   * デフォルトのリトライ可能判定
   * @param error - エラーオブジェクト
   * @returns リトライ可能な場合はtrue
   */
  private defaultIsRetryable(error: any): boolean {
    // ネットワークエラー
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return true;
    }

    // HTTPステータスコードによる判定
    if (error.status) {
      // 429 (Too Many Requests) - レート制限
      if (error.status === 429) {
        return true;
      }

      // 5xx - サーバーエラー
      if (error.status >= 500 && error.status < 600) {
        return true;
      }

      // 408 (Request Timeout)
      if (error.status === 408) {
        return true;
      }
    }

    // retryableフラグがある場合
    if (error.retryable === true) {
      return true;
    }

    return false;
  }

  /**
   * エラーからretryAfter値を取得
   * @param error - エラーオブジェクト
   * @returns retryAfter値（秒）、ない場合はnull
   */
  private getRetryAfter(error: any): number | null {
    if (error.retryAfter && typeof error.retryAfter === 'number') {
      return error.retryAfter;
    }

    // Retry-Afterヘッダーから取得
    if (error.headers && error.headers['retry-after']) {
      const retryAfter = parseInt(error.headers['retry-after']);
      if (!isNaN(retryAfter)) {
        return retryAfter;
      }
    }

    return null;
  }

  /**
   * 指定時間待機
   * @param ms - 待機時間（ミリ秒）
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}