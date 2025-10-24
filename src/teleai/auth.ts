import { AuthenticationError } from './types';

export class TeleAIAuth {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new AuthenticationError('API key is required');
    }
    this.apiKey = apiKey;
  }

  getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  validateApiKey(): void {
    if (!this.apiKey || this.apiKey.trim().length === 0) {
      throw new AuthenticationError('Invalid API key');
    }
  }
}