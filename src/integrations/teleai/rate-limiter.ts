/**
 * レート制限機能の実装
 */

export class RateLimiter {
  private requests: number[] = [];
  private readonly windowMs: number;
  private readonly maxRequests: number;

  /**
   * レート制限を初期化
   * @param maxRequests - 制限内の最大リクエスト数
   * @param windowMs - 時間枠（ミリ秒）
   */
  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * リクエストが可能かチェック
   * @returns リクエスト可能な場合はtrue
   */
  canMakeRequest(): boolean {
    this.cleanupOldRequests();
    return this.requests.length < this.maxRequests;
  }

  /**
   * リクエストを記録
   */
  recordRequest(): void {
    this.cleanupOldRequests();
    if (this.requests.length >= this.maxRequests) {
      throw new Error(`レート制限を超過しました。${this.windowMs / 1000}秒間に${this.maxRequests}リクエストまでです。`);
    }
    this.requests.push(Date.now());
  }

  /**
   * 次のリクエストまでの待機時間を取得
   * @returns 待機時間（ミリ秒）、すぐにリクエスト可能な場合は0
   */
  getWaitTime(): number {
    this.cleanupOldRequests();
    if (this.requests.length < this.maxRequests) {
      return 0;
    }
    
    const oldestRequest = this.requests[0];
    const waitTime = oldestRequest + this.windowMs - Date.now();
    return Math.max(0, waitTime);
  }

  /**
   * 残りリクエスト数を取得
   * @returns 残りリクエスト数
   */
  getRemainingRequests(): number {
    this.cleanupOldRequests();
    return Math.max(0, this.maxRequests - this.requests.length);
  }

  /**
   * リセット時刻を取得
   * @returns リセット時刻（UNIXタイムスタンプ）
   */
  getResetTime(): number {
    this.cleanupOldRequests();
    if (this.requests.length === 0) {
      return Date.now() + this.windowMs;
    }
    return this.requests[0] + this.windowMs;
  }

  /**
   * 古いリクエスト記録を削除
   */
  private cleanupOldRequests(): void {
    const cutoff = Date.now() - this.windowMs;
    this.requests = this.requests.filter(timestamp => timestamp > cutoff);
  }

  /**
   * レート制限情報を取得
   */
  getRateLimitInfo() {
    this.cleanupOldRequests();
    return {
      remaining: this.getRemainingRequests(),
      reset: Math.floor(this.getResetTime() / 1000),
      limit: this.maxRequests,
    };
  }

  /**
   * リクエスト実行まで待機
   */
  async waitIfNeeded(): Promise<void> {
    const waitTime = this.getWaitTime();
    if (waitTime > 0) {
      console.log(`レート制限のため${(waitTime / 1000).toFixed(1)}秒待機します...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}