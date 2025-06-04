import { describe, test, expect, beforeEach, mock, setSystemTime } from 'bun:test';
import { TeleAIClient } from '../src/teleai/client';
import { 
  TeleAIError, 
  AuthenticationError,
  RateLimitError,
  TranscribeRequest,
  SentimentAnalysisRequest,
  ExtractSummaryRequest
} from '../src/teleai/types';

// Mock fetch globally
const mockFetch = mock();
global.fetch = mockFetch;

describe('TeleAIClient', () => {
  let client: TeleAIClient;
  const mockConfig = {
    apiKey: 'test-api-key',
    baseUrl: 'https://teleai-pro-api.onrender.com',
    timeout: 1000
  };

  beforeEach(() => {
    mockFetch.mockReset();
    client = new TeleAIClient(mockConfig);
  });

  describe('constructor', () => {
    test('should create client with config', () => {
      expect(client).toBeDefined();
    });

    test('should set default timeout if not provided', () => {
      const clientNoTimeout = new TeleAIClient({
        apiKey: 'test-key',
        baseUrl: 'https://api.test.com'
      });
      expect(clientNoTimeout).toBeDefined();
    });
  });

  describe('transcribe', () => {
    test('should successfully transcribe audio', async () => {
      const mockResponse = {
        text: 'Hello world',
        language: 'en',
        confidence: 0.95
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const request: TranscribeRequest = {
        audio: 'base64-audio-data',
        language: 'en'
      };

      const result = await client.transcribe(request);
      
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://teleai-pro-api.onrender.com/transcribe',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(request)
        })
      );
    });

    test('should handle transcribe error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ message: 'Invalid audio format' })
      });

      const request: TranscribeRequest = {
        audio: 'invalid-audio'
      };

      await expect(client.transcribe(request)).rejects.toThrow('Invalid audio format');
    });
  });

  describe('analyzeSentiment', () => {
    test('should successfully analyze sentiment', async () => {
      const mockResponse = {
        sentiment: 'positive',
        confidence: 0.87,
        scores: {
          positive: 0.87,
          negative: 0.08,
          neutral: 0.05
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const request: SentimentAnalysisRequest = {
        text: 'This is a great product!',
        language: 'en'
      };

      const result = await client.analyzeSentiment(request);
      
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://teleai-pro-api.onrender.com/analyze-sentiment',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(request)
        })
      );
    });
  });

  describe('extractSummary', () => {
    test('should successfully extract summary', async () => {
      const mockResponse = {
        summary: 'This is a summary',
        keyPoints: ['Point 1', 'Point 2']
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const request: ExtractSummaryRequest = {
        text: 'Long text to summarize...',
        maxLength: 100
      };

      const result = await client.extractSummary(request);
      
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://teleai-pro-api.onrender.com/extract-summary',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(request)
        })
      );
    });
  });

  describe('health', () => {
    test('should successfully get health status', async () => {
      const mockResponse = {
        status: 'healthy',
        version: '1.0.0',
        uptime: 3600,
        services: {
          database: { status: 'up', latency: 5 },
          cache: { status: 'up', latency: 2 }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await client.health();
      
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://teleai-pro-api.onrender.com/health',
        expect.objectContaining({
          method: 'GET'
        })
      );
    });
  });

  describe('error handling', () => {
    test('should handle authentication errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ message: 'Invalid API key' })
      });

      await expect(client.health()).rejects.toThrow(AuthenticationError);
    });

    test('should handle timeout errors', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise((resolve) => setTimeout(resolve, 2000))
      );

      await expect(client.health()).rejects.toThrow('Request timeout');
    });

    test('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.health()).rejects.toThrow('Network error');
    });

    test('should handle non-JSON error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error'
      });

      await expect(client.health()).rejects.toThrow('Internal Server Error');
    });
  });

  describe('rate limiting', () => {
    test('should enforce rate limits', async () => {
      const mockResponse = { status: 'healthy' };
      
      // Create client with very low rate limit for testing
      const rateLimitedClient = new TeleAIClient(mockConfig);
      
      // Make requests up to the limit
      for (let i = 0; i < 100; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });
      }

      // Make 100 requests quickly
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(rateLimitedClient.health());
      }
      await Promise.all(promises);

      // 101st request should fail with rate limit
      await expect(rateLimitedClient.health()).rejects.toThrow(RateLimitError);
    });

    test('should return rate limit info', () => {
      const info = client.getRateLimitInfo();
      
      expect(info).toEqual({
        remaining: 100,
        limit: 100,
        windowMs: 60000
      });
    });
  });

  describe('retry logic', () => {
    test('should retry on 5xx errors', async () => {
      // First two calls fail with 500, third succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => JSON.stringify({ message: 'Server error' })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          text: async () => JSON.stringify({ message: 'Service unavailable' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'healthy' })
        });

      const result = await client.health();
      
      expect(result).toEqual({ status: 'healthy' });
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    test('should not retry on 4xx errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ message: 'Bad request' })
      });

      await expect(client.health()).rejects.toThrow(TeleAIError);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No retry
    });
  });
});