import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { TeleAIClient } from '../src/teleai/client'
import type { TeleAIConfig } from '../src/teleai/types'

// Mock fetch globally
const mockFetch = mock(() => Promise.resolve({
  ok: true,
  status: 200,
  statusText: 'OK',
  json: () => Promise.resolve({})
}))

global.fetch = mockFetch as any

describe('TeleAIClient', () => {
  let client: TeleAIClient
  const config: TeleAIConfig = {
    apiKey: 'test-api-key',
    baseUrl: 'https://api.test.com',
    timeout: 5000,
    maxRetries: 2
  }

  beforeEach(() => {
    client = new TeleAIClient(config)
    mockFetch.mockClear()
  })

  describe('constructor', () => {
    test('should create client with default values', () => {
      const defaultClient = new TeleAIClient({ apiKey: 'test' })
      expect(defaultClient).toBeDefined()
    })

    test('should create client with custom config', () => {
      expect(client).toBeDefined()
    })
  })

  describe('transcribe', () => {
    test('should make POST request to /transcribe endpoint', async () => {
      const mockResponse = {
        text: 'Hello world',
        language: 'en',
        duration: 5.5
      }
      
      mockFetch.mockImplementationOnce(() => Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      }))

      const result = await client.transcribe({
        audio: 'base64-audio-data',
        language: 'en'
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/transcribe',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            audio: 'base64-audio-data',
            language: 'en'
          })
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('analyzeSentiment', () => {
    test('should make POST request to /analyze-sentiment endpoint', async () => {
      const mockResponse = {
        sentiment: 'positive',
        confidence: 0.95,
        scores: {
          positive: 0.95,
          negative: 0.02,
          neutral: 0.03
        }
      }
      
      mockFetch.mockImplementationOnce(() => Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      }))

      const result = await client.analyzeSentiment({
        text: 'I love this product!',
        language: 'en'
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/analyze-sentiment',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            text: 'I love this product!',
            language: 'en'
          })
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('extractSummary', () => {
    test('should make POST request to /extract-summary endpoint', async () => {
      const mockResponse = {
        summary: 'This is a summary',
        keyPoints: ['Point 1', 'Point 2']
      }
      
      mockFetch.mockImplementationOnce(() => Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      }))

      const result = await client.extractSummary({
        text: 'Long text to summarize...',
        maxLength: 100,
        style: 'bullets'
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/extract-summary',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            text: 'Long text to summarize...',
            maxLength: 100,
            style: 'bullets'
          })
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('health', () => {
    test('should make GET request to /health endpoint', async () => {
      const mockResponse = {
        status: 'healthy',
        version: '1.0.0',
        uptime: 3600,
        services: {
          api: { status: 'operational' },
          database: { status: 'operational', latency: 15 }
        }
      }
      
      mockFetch.mockImplementationOnce(() => Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      }))

      const result = await client.health()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/health',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          })
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('error handling', () => {
    test('should throw TeleAIError on HTTP error', async () => {
      mockFetch.mockImplementationOnce(() => Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: () => Promise.resolve('{"message": "Endpoint not found", "code": "NOT_FOUND"}')
      }))

      await expect(client.health()).rejects.toThrow('Endpoint not found')
    })

    test('should handle non-JSON error responses', async () => {
      mockFetch.mockImplementationOnce(() => Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Server error occurred')
      }))

      await expect(client.health()).rejects.toThrow('Server error occurred')
    })

    test('should handle timeout', async () => {
      const slowClient = new TeleAIClient({
        apiKey: 'test',
        timeout: 100
      })

      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(resolve, 200))
      )

      await expect(slowClient.health()).rejects.toThrow()
    })
  })

  describe('rate limiting', () => {
    test('should get rate limit info', () => {
      const info = client.getRateLimitInfo()
      expect(info.limit).toBe(100)
      expect(info.remaining).toBe(100)
      expect(info.reset).toBeInstanceOf(Date)
    })

    test('should track remaining requests', async () => {
      mockFetch.mockImplementation(() => Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({})
      }))

      expect(client.getRateLimitInfo().remaining).toBe(100)
      
      await client.health()
      expect(client.getRateLimitInfo().remaining).toBe(99)
      
      await client.health()
      expect(client.getRateLimitInfo().remaining).toBe(98)
    })
  })

  describe('retry logic', () => {
    test('should retry on 5xx errors', async () => {
      let attempts = 0
      mockFetch.mockImplementation(() => {
        attempts++
        if (attempts < 3) {
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Server Error',
            text: () => Promise.resolve('{"message": "Server error"}')
          })
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ status: 'healthy' })
        })
      })

      const result = await client.health()
      expect(result.status).toBe('healthy')
      expect(attempts).toBe(3)
    })

    test('should not retry on 4xx errors (except specific ones)', async () => {
      let attempts = 0
      mockFetch.mockImplementation(() => {
        attempts++
        return Promise.resolve({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          text: () => Promise.resolve('{"message": "Invalid request"}')
        })
      })

      await expect(client.health()).rejects.toThrow('Invalid request')
      expect(attempts).toBe(1)
    })
  })
})