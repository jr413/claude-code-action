/**
 * レート制限機能のテスト
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { RateLimiter } from '../../src/integrations/teleai/rate-limiter';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter(5, 1000); // 1秒間に5リクエスト
  });

  describe('canMakeRequest', () => {
    it('制限内でリクエスト可能', () => {
      expect(rateLimiter.canMakeRequest()).toBe(true);
      rateLimiter.recordRequest();
      expect(rateLimiter.canMakeRequest()).toBe(true);
    });

    it('制限に達したらfalseを返す', () => {
      // 5回リクエストを記録
      for (let i = 0; i < 5; i++) {
        rateLimiter.recordRequest();
      }
      expect(rateLimiter.canMakeRequest()).toBe(false);
    });
  });

  describe('recordRequest', () => {
    it('リクエストを正常に記録', () => {
      expect(() => rateLimiter.recordRequest()).not.toThrow();
      expect(rateLimiter.getRemainingRequests()).toBe(4);
    });

    it('制限超過時にエラーをスロー', () => {
      // 5回リクエストを記録
      for (let i = 0; i < 5; i++) {
        rateLimiter.recordRequest();
      }
      
      expect(() => rateLimiter.recordRequest()).toThrow(
        'レート制限を超過しました。1秒間に5リクエストまでです。'
      );
    });
  });

  describe('getRemainingRequests', () => {
    it('残りリクエスト数を正確に返す', () => {
      expect(rateLimiter.getRemainingRequests()).toBe(5);
      
      rateLimiter.recordRequest();
      expect(rateLimiter.getRemainingRequests()).toBe(4);
      
      rateLimiter.recordRequest();
      expect(rateLimiter.getRemainingRequests()).toBe(3);
    });
  });

  describe('getWaitTime', () => {
    it('待機不要な場合は0を返す', () => {
      expect(rateLimiter.getWaitTime()).toBe(0);
      
      // 3回リクエスト（制限内）
      for (let i = 0; i < 3; i++) {
        rateLimiter.recordRequest();
      }
      expect(rateLimiter.getWaitTime()).toBe(0);
    });

    it('制限に達した場合は待機時間を返す', async () => {
      // 5回リクエストで制限に達する
      for (let i = 0; i < 5; i++) {
        rateLimiter.recordRequest();
      }
      
      const waitTime = rateLimiter.getWaitTime();
      expect(waitTime).toBeGreaterThan(0);
      expect(waitTime).toBeLessThanOrEqual(1000);
    });
  });

  describe('古いリクエストのクリーンアップ', () => {
    it('時間枠を過ぎたリクエストを削除', async () => {
      rateLimiter.recordRequest();
      expect(rateLimiter.getRemainingRequests()).toBe(4);
      
      // 1.1秒待機
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // 古いリクエストがクリーンアップされる
      expect(rateLimiter.getRemainingRequests()).toBe(5);
    });
  });

  describe('getRateLimitInfo', () => {
    it('正確なレート制限情報を返す', () => {
      const info = rateLimiter.getRateLimitInfo();
      expect(info.limit).toBe(5);
      expect(info.remaining).toBe(5);
      expect(info.reset).toBeGreaterThan(Date.now() / 1000);
      
      rateLimiter.recordRequest();
      const info2 = rateLimiter.getRateLimitInfo();
      expect(info2.remaining).toBe(4);
    });
  });

  describe('waitIfNeeded', () => {
    it('待機不要な場合はすぐに完了', async () => {
      const start = Date.now();
      await rateLimiter.waitIfNeeded();
      const elapsed = Date.now() - start;
      
      expect(elapsed).toBeLessThan(10); // ほぼ即座に完了
    });

    it('制限に達した場合は適切に待機', async () => {
      // 5回リクエストで制限に達する
      for (let i = 0; i < 5; i++) {
        rateLimiter.recordRequest();
      }
      
      const start = Date.now();
      const waitPromise = rateLimiter.waitIfNeeded();
      
      // 待機中は制限に達している
      expect(rateLimiter.canMakeRequest()).toBe(false);
      
      await waitPromise;
      const elapsed = Date.now() - start;
      
      // 待機時間は0より大きく、1秒以下
      expect(elapsed).toBeGreaterThan(0);
      expect(elapsed).toBeLessThanOrEqual(1100); // 余裕を持たせる
    });
  });
});