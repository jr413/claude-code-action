import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { TeleAIClient } from '../../src/teleai/client';
import type { TeleAIConfig } from '../../src/teleai/types';

const mockFetch = mock(() => Promise.resolve({
  ok: true,
  status: 200,
  json: () => Promise.resolve({}),
}));

global.fetch = mockFetch as any;

describe('TeleAIClient', () => {
  let client: TeleAIClient;
  const config: TeleAIConfig = {
    apiBaseUrl: 'https://api.teleai.test',
    bearerToken: 'test-token',
    timeout: 5000,
    maxRetries: 2,
  };
  
  beforeEach(() => {
    client = new TeleAIClient(config);
    mockFetch.mockClear();
  });

  describe('transcribe', () => {
    it('should make POST request to /transcribe endpoint', async () => {
      const mockResponse = { text: 'Hello world', confidence: 0.95, duration: 5.2 };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.transcribe({ audio: 'base64-audio-data' });
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.teleai.test/transcribe',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          }),
          body: JSON.stringify({ audio: 'base64-audio-data' }),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('analyzeSentiment', () => {
    it('should make POST request to /analyze-sentiment endpoint', async () => {
      const mockResponse = { sentiment: 'positive', score: 0.8 };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.analyzeSentiment({ text: 'I love this!' });
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.teleai.test/analyze-sentiment',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ text: 'I love this!' }),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('extractSummary', () => {
    it('should make POST request to /extract-summary endpoint', async () => {
      const mockResponse = { summary: 'Short summary', keyPoints: ['Point 1', 'Point 2'] };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.extractSummary({ text: 'Long text...', maxLength: 100 });
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.teleai.test/extract-summary',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ text: 'Long text...', maxLength: 100 }),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('checkHealth', () => {
    it('should make GET request to /health endpoint', async () => {
      const mockResponse = { status: 'healthy', version: '1.0.0', timestamp: '2024-01-01T00:00:00Z' };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.checkHealth();
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.teleai.test/health',
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('error handling', () => {
    it('should parse API error response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          code: 'INVALID_REQUEST',
          message: 'Invalid audio format',
          details: { format: 'unsupported' },
        }),
      });

      await expect(client.transcribe({ audio: 'invalid' })).rejects.toEqual({
        code: 'INVALID_REQUEST',
        message: 'Invalid audio format',
        statusCode: 400,
        details: { format: 'unsupported' },
      });
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AbortError')), 100)
        )
      );

      const fastClient = new TeleAIClient({ ...config, timeout: 50 });
      
      await expect(fastClient.checkHealth()).rejects.toMatchObject({
        code: 'TIMEOUT',
        message: 'Request timed out',
        statusCode: 408,
      });
    });

    it('should retry on retryable errors', async () => {
      let attempts = 0;
      mockFetch.mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.resolve({
            ok: false,
            status: 503,
            json: () => Promise.resolve({ code: 'SERVICE_UNAVAILABLE' }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ status: 'healthy' }),
        });
      });

      const result = await client.checkHealth();
      
      expect(attempts).toBe(3);
      expect(result).toEqual({ status: 'healthy' });
    });

    it('should not retry on non-retryable errors', async () => {
      let attempts = 0;
      mockFetch.mockImplementation(() => {
        attempts++;
        return Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ code: 'UNAUTHORIZED' }),
        });
      });

      await expect(client.checkHealth()).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        statusCode: 401,
      });
      
      expect(attempts).toBe(1);
    });
  });
});