import type { TeleAIConfig } from './types'

export class TeleAIAuth {
  private apiKey: string
  private tokenCache: { token: string; expiresAt: number } | null = null

  constructor(config: TeleAIConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required')
    }
    this.apiKey = config.apiKey
  }

  async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getToken()
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  }

  private async getToken(): Promise<string> {
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now()) {
      return this.tokenCache.token
    }

    const token = await this.refreshToken()
    this.tokenCache = {
      token,
      expiresAt: Date.now() + 3600 * 1000 // 1 hour
    }
    return token
  }

  private async refreshToken(): Promise<string> {
    // In a real implementation, this might exchange the API key for a JWT
    // For now, we'll use the API key directly
    return this.apiKey
  }

  clearCache(): void {
    this.tokenCache = null
  }
}