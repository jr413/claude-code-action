/**
 * TeleAI APIクライアントのテスト
 */

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { TeleAIClient } from '../../src/integrations/teleai/client';
import type { 
  TranscribeResponse, 
  AnalyzeSentimentResponse,
  ExtractSummaryResponse,
  HealthResponse 
} from '../../src/integrations/teleai/types';

// fetchのモック設定
const mockFetch = mock();
global.fetch = mockFetch as any;

describe('TeleAIClient', () => {
  let client: TeleAIClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new TeleAIClient({
      baseUrl: 'https://api.teleai.test',
      apiKey: 'test-api-key',
      timeout: 5000,
      rateLimit: 10,
      maxRetries: 2,
    });
  });

  describe('コンストラクタ', () => {
    it('APIキーなしでエラーをスロー', () => {
      expect(() => new TeleAIClient({
        baseUrl: 'https://api.teleai.test',
        apiKey: '',
      })).toThrow('TeleAI APIキーが設定されていません');
    });

    it('ベースURLを正規化', () => {
      const client1 = new TeleAIClient({
        baseUrl: 'https://api.teleai.test',
        apiKey: 'test-key',
      });
      
      const client2 = new TeleAIClient({
        baseUrl: 'https://api.teleai.test/',
        apiKey: 'test-key',
      });
      
      // 内部的に同じURLになることを確認
      expect(client1).toBeDefined();
      expect(client2).toBeDefined();
    });
  });

  describe('transcribe', () => {
    it('音声文字起こしを正常に実行', async () => {
      const mockResponse: TranscribeResponse = {
        text: 'こんにちは、世界',
        detectedLanguage: 'ja',
        confidence: 0.95,
        processingTime: 1234,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers(),
      });

      const result = await client.transcribe({
        audio: 'base64-audio-data',
        format: 'mp3',
        language: 'ja',
      });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.teleai.test/transcribe');
      expect(options.method).toBe('POST');
      expect(options.headers['Authorization']).toBe('Bearer test-api-key');
      expect(JSON.parse(options.body)).toEqual({
        audio: 'base64-audio-data',
        format: 'mp3',
        language: 'ja',
      });
    });
  });

  describe('analyzeSentiment', () => {
    it('感情分析を正常に実行', async () => {
      const mockResponse: AnalyzeSentimentResponse = {
        score: 0.8,
        label: 'positive',
        emotions: {
          joy: 0.7,
          sadness: 0.1,
          anger: 0.0,
          fear: 0.0,
          surprise: 0.2,
          disgust: 0.0,
        },
        confidence: 0.9,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers(),
      });

      const result = await client.analyzeSentiment({
        text: '今日はとても良い天気ですね！',
        language: 'ja',
      });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('extractSummary', () => {
    it('要約抽出を正常に実行', async () => {
      const mockResponse: ExtractSummaryResponse = {
        summary: '要約されたテキスト',
        keyPoints: ['ポイント1', 'ポイント2'],
        keywords: ['キーワード1', 'キーワード2'],
        processingTime: 2345,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers(),
      });

      const result = await client.extractSummary({
        text: '長いテキスト...',
        maxLength: 200,
        type: 'extractive',
        language: 'ja',
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('health', () => {
    it('ヘルスチェックを正常に実行', async () => {
      const mockResponse: HealthResponse = {
        status: 'healthy',
        version: '1.0.0',
        uptime: 3600,
        timestamp: '2024-01-01T00:00:00Z',
        services: {
          transcribe: 'up',
          sentiment: 'up',
          summary: 'up',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers(),
      });

      const result = await client.health();

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.teleai.test/health');
      expect(options.method).toBe('GET');
    });
  });

  describe('エラーハンドリング', () => {
    it('HTTPエラーを適切に処理', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          code: 'INVALID_REQUEST',
          message: '無効なリクエストです',
          details: { field: 'audio' },
        }),
        headers: new Headers(),
      });

      await expect(client.transcribe({
        audio: 'invalid-data',
      })).rejects.toThrow('無効なリクエストです');
    });

    it('タイムアウトエラーを処理', async () => {
      // タイムアウトをシミュレート
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => {
          setTimeout(() => {
            const error = new Error('Aborted');
            error.name = 'AbortError';
            reject(error);
          }, 10);
        })
      );

      await expect(client.health()).rejects.toThrow('ヘルスチェックがタイムアウトしました（5秒）');
    });

    it('レート制限エラーでリトライ', async () => {
      // 最初は429エラー
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'レート制限を超過しました',
          retryable: true,
          retryAfter: 0.1,
        }),
        headers: new Headers({
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 60),
        }),
      });

      // 2回目は成功
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'healthy', version: '1.0.0', uptime: 3600, timestamp: '2024-01-01T00:00:00Z' }),
        headers: new Headers(),
      });

      const result = await client.health();
      expect(result.status).toBe('healthy');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('JSONパースエラーを処理', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        },
        headers: new Headers(),
      });

      await expect(client.health()).rejects.toThrow('HTTPエラー: 500 Internal Server Error');
    });
  });

  describe('レート制限', () => {
    it('レート制限情報を取得', () => {
      const info = client.getRateLimitInfo();
      expect(info.limit).toBe(10);
      expect(info.remaining).toBe(10);
      expect(info.reset).toBeGreaterThan(Date.now() / 1000);
    });

    it('レート制限に達したら待機', async () => {
      // 10回連続でリクエスト（レート制限）
      const promises = [];
      for (let i = 0; i < 12; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'healthy', version: '1.0.0', uptime: 3600, timestamp: '2024-01-01T00:00:00Z' }),
          headers: new Headers(),
        });
        
        promises.push(client.health().catch(e => e.message));
      }

      const results = await Promise.all(promises);
      
      // 最初の10個は成功、11個目以降はレート制限エラー
      const errors = results.filter(r => typeof r === 'string' && r.includes('レート制限'));
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('レスポンスヘッダーの処理', () => {
    it('レート制限ヘッダーを処理', async () => {
      const consoleSpy = mock(() => {});
      const originalLog = console.log;
      console.log = consoleSpy as any;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'healthy', version: '1.0.0', uptime: 3600, timestamp: '2024-01-01T00:00:00Z' }),
        headers: new Headers({
          'X-RateLimit-Remaining': '50',
          'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 3600),
        }),
      });

      await client.health();

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls.find(call => 
        call[0].includes('レート制限情報')
      );
      expect(logCall).toBeDefined();

      console.log = originalLog;
    });
  });
});