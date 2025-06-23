/**
 * リトライハンドラーのテスト
 */

import { describe, it, expect, mock } from 'bun:test';
import { RetryHandler } from '../../src/integrations/teleai/retry-handler';

describe('RetryHandler', () => {
  describe('基本的なリトライ機能', () => {
    it('成功時はリトライなしで結果を返す', async () => {
      const handler = new RetryHandler({ maxRetries: 3 });
      const mockFn = mock(() => Promise.resolve('success'));
      
      const result = await handler.execute(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('一時的なエラー後に成功', async () => {
      const handler = new RetryHandler({ 
        maxRetries: 3,
        initialDelay: 10,
        maxDelay: 100,
      });
      
      let attempts = 0;
      const mockFn = mock(async () => {
        attempts++;
        if (attempts < 3) {
          const error = new Error('一時的なエラー');
          (error as any).status = 500;
          throw error;
        }
        return 'success';
      });
      
      const result = await handler.execute(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('最大リトライ回数に達したらエラーをスロー', async () => {
      const handler = new RetryHandler({ 
        maxRetries: 2,
        initialDelay: 10,
      });
      
      const mockFn = mock(async () => {
        const error = new Error('永続的なエラー');
        (error as any).status = 500;
        throw error;
      });
      
      await expect(handler.execute(mockFn)).rejects.toThrow('永続的なエラー');
      expect(mockFn).toHaveBeenCalledTimes(3); // 初回 + 2回のリトライ
    });
  });

  describe('リトライ可能性の判定', () => {
    it('5xxエラーはリトライ可能', async () => {
      const handler = new RetryHandler({ maxRetries: 1, initialDelay: 10 });
      let attempts = 0;
      
      const mockFn = mock(async () => {
        attempts++;
        if (attempts === 1) {
          const error = new Error('サーバーエラー');
          (error as any).status = 503;
          throw error;
        }
        return 'success';
      });
      
      const result = await handler.execute(mockFn);
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('429エラー（レート制限）はリトライ可能', async () => {
      const handler = new RetryHandler({ maxRetries: 1, initialDelay: 10 });
      let attempts = 0;
      
      const mockFn = mock(async () => {
        attempts++;
        if (attempts === 1) {
          const error = new Error('レート制限');
          (error as any).status = 429;
          throw error;
        }
        return 'success';
      });
      
      const result = await handler.execute(mockFn);
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('4xxエラー（429以外）はリトライ不可', async () => {
      const handler = new RetryHandler({ maxRetries: 3 });
      
      const mockFn = mock(async () => {
        const error = new Error('Bad Request');
        (error as any).status = 400;
        throw error;
      });
      
      await expect(handler.execute(mockFn)).rejects.toThrow('Bad Request');
      expect(mockFn).toHaveBeenCalledTimes(1); // リトライなし
    });

    it('retryableフラグがtrueの場合はリトライ可能', async () => {
      const handler = new RetryHandler({ maxRetries: 1, initialDelay: 10 });
      let attempts = 0;
      
      const mockFn = mock(async () => {
        attempts++;
        if (attempts === 1) {
          const error = new Error('カスタムエラー');
          (error as any).retryable = true;
          throw error;
        }
        return 'success';
      });
      
      const result = await handler.execute(mockFn);
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('指数バックオフ', () => {
    it('遅延時間が指数的に増加', async () => {
      const handler = new RetryHandler({
        maxRetries: 3,
        initialDelay: 100,
        maxDelay: 1000,
        backoffFactor: 2,
      });
      
      const delays: number[] = [];
      let lastCallTime = Date.now();
      
      const mockFn = mock(async () => {
        const now = Date.now();
        delays.push(now - lastCallTime);
        lastCallTime = now;
        
        const error = new Error('エラー');
        (error as any).status = 500;
        throw error;
      });
      
      await expect(handler.execute(mockFn)).rejects.toThrow();
      
      // 初回は即座に実行
      expect(delays[0]).toBeLessThan(50);
      
      // 2回目は約100ms後（初期遅延）
      expect(delays[1]).toBeGreaterThan(90);
      expect(delays[1]).toBeLessThan(150);
      
      // 3回目は約200ms後（100ms * 2）
      expect(delays[2]).toBeGreaterThan(190);
      expect(delays[2]).toBeLessThan(250);
      
      // 4回目は約400ms後（200ms * 2）
      expect(delays[3]).toBeGreaterThan(390);
      expect(delays[3]).toBeLessThan(450);
    });
  });

  describe('retryAfterの処理', () => {
    it('retryAfter値が指定された場合はそれを使用', async () => {
      const handler = new RetryHandler({
        maxRetries: 1,
        initialDelay: 1000, // 通常は1秒待機
      });
      
      let attempts = 0;
      const start = Date.now();
      
      const mockFn = mock(async () => {
        attempts++;
        if (attempts === 1) {
          const error = new Error('レート制限');
          (error as any).status = 429;
          (error as any).retryAfter = 0.1; // 0.1秒後にリトライ
          throw error;
        }
        return 'success';
      });
      
      await handler.execute(mockFn);
      const elapsed = Date.now() - start;
      
      // retryAfterの値（100ms）に従って待機
      expect(elapsed).toBeGreaterThan(90);
      expect(elapsed).toBeLessThan(200); // 通常の1秒より短い
    });
  });

  describe('カスタムリトライ判定', () => {
    it('カスタム判定関数を使用', async () => {
      const handler = new RetryHandler({
        maxRetries: 2,
        initialDelay: 10,
        isRetryable: (error) => error.message === 'リトライ可能',
      });
      
      // リトライ可能なエラー
      let attempts1 = 0;
      const mockFn1 = mock(async () => {
        attempts1++;
        if (attempts1 === 1) {
          throw new Error('リトライ可能');
        }
        return 'success';
      });
      
      const result1 = await handler.execute(mockFn1);
      expect(result1).toBe('success');
      expect(mockFn1).toHaveBeenCalledTimes(2);
      
      // リトライ不可能なエラー
      const mockFn2 = mock(async () => {
        throw new Error('リトライ不可');
      });
      
      await expect(handler.execute(mockFn2)).rejects.toThrow('リトライ不可');
      expect(mockFn2).toHaveBeenCalledTimes(1);
    });
  });
});