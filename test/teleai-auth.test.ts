import { describe, test, expect, beforeEach } from 'bun:test'
import { TeleAIAuth } from '../src/teleai/auth'

describe('TeleAIAuth', () => {
  let auth: TeleAIAuth

  beforeEach(() => {
    auth = new TeleAIAuth({ apiKey: 'test-api-key' })
  })

  test('should throw error if API key is not provided', () => {
    expect(() => new TeleAIAuth({ apiKey: '' })).toThrow('API key is required')
  })

  test('should return auth headers with Bearer token', async () => {
    const headers = await auth.getAuthHeaders()
    expect(headers).toEqual({
      'Authorization': 'Bearer test-api-key',
      'Content-Type': 'application/json',
    })
  })

  test('should cache token and reuse it', async () => {
    const headers1 = await auth.getAuthHeaders()
    const headers2 = await auth.getAuthHeaders()
    expect(headers1).toEqual(headers2)
  })

  test('should clear cache when clearCache is called', async () => {
    await auth.getAuthHeaders()
    auth.clearCache()
    // This will get a fresh token
    const headers = await auth.getAuthHeaders()
    expect(headers.Authorization).toBe('Bearer test-api-key')
  })
})