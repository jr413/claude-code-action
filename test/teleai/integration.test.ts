import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { TeleAIClient } from '../../src/teleai/client';

describe('TeleAI Integration Tests', () => {
  let client: TeleAIClient;
  const apiBaseUrl = process.env.TELEAI_API_URL || 'https://teleai-pro-api.onrender.com';
  const bearerToken = process.env.TELEAI_API_TOKEN || 'test-token';
  
  beforeAll(() => {
    client = new TeleAIClient({
      apiBaseUrl,
      bearerToken,
      timeout: 30000,
      maxRetries: 3,
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      if (!process.env.TELEAI_API_TOKEN) {
        console.log('Skipping integration test - TELEAI_API_TOKEN not set');
        return;
      }

      const health = await client.checkHealth();
      
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('version');
      expect(health).toHaveProperty('timestamp');
      expect(['healthy', 'unhealthy']).toContain(health.status);
    });
  });

  describe('Transcribe', () => {
    it('should transcribe audio successfully', async () => {
      if (!process.env.TELEAI_API_TOKEN) {
        console.log('Skipping integration test - TELEAI_API_TOKEN not set');
        return;
      }

      const mockAudioData = Buffer.from('mock-audio-data').toString('base64');
      
      try {
        const result = await client.transcribe({
          audio: mockAudioData,
          language: 'en',
        });
        
        expect(result).toHaveProperty('text');
        expect(result).toHaveProperty('confidence');
        expect(result).toHaveProperty('duration');
        expect(typeof result.text).toBe('string');
        expect(typeof result.confidence).toBe('number');
        expect(typeof result.duration).toBe('number');
      } catch (error: any) {
        if (error.statusCode === 401) {
          console.log('Authentication failed - check TELEAI_API_TOKEN');
        }
        throw error;
      }
    });
  });

  describe('Analyze Sentiment', () => {
    it('should analyze sentiment successfully', async () => {
      if (!process.env.TELEAI_API_TOKEN) {
        console.log('Skipping integration test - TELEAI_API_TOKEN not set');
        return;
      }

      try {
        const result = await client.analyzeSentiment({
          text: 'I absolutely love this new feature! It works perfectly.',
          language: 'en',
        });
        
        expect(result).toHaveProperty('sentiment');
        expect(result).toHaveProperty('score');
        expect(['positive', 'negative', 'neutral']).toContain(result.sentiment);
        expect(typeof result.score).toBe('number');
        expect(result.score).toBeGreaterThanOrEqual(-1);
        expect(result.score).toBeLessThanOrEqual(1);
      } catch (error: any) {
        if (error.statusCode === 401) {
          console.log('Authentication failed - check TELEAI_API_TOKEN');
        }
        throw error;
      }
    });
  });

  describe('Extract Summary', () => {
    it('should extract summary successfully', async () => {
      if (!process.env.TELEAI_API_TOKEN) {
        console.log('Skipping integration test - TELEAI_API_TOKEN not set');
        return;
      }

      const longText = `
        Artificial Intelligence has revolutionized many industries over the past decade.
        Machine learning algorithms can now process vast amounts of data in seconds.
        Natural language processing enables computers to understand human language.
        Computer vision allows machines to interpret visual information.
        These technologies are being applied in healthcare, finance, transportation, and more.
      `;

      try {
        const result = await client.extractSummary({
          text: longText,
          maxLength: 100,
          style: 'bullets',
        });
        
        expect(result).toHaveProperty('summary');
        expect(result).toHaveProperty('keyPoints');
        expect(typeof result.summary).toBe('string');
        expect(Array.isArray(result.keyPoints)).toBe(true);
        expect(result.summary.length).toBeLessThanOrEqual(100);
      } catch (error: any) {
        if (error.statusCode === 401) {
          console.log('Authentication failed - check TELEAI_API_TOKEN');
        }
        throw error;
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limiting correctly', async () => {
      if (!process.env.TELEAI_API_TOKEN) {
        console.log('Skipping integration test - TELEAI_API_TOKEN not set');
        return;
      }

      const promises = [];
      const startTime = Date.now();
      
      for (let i = 0; i < 5; i++) {
        promises.push(client.checkHealth());
      }
      
      await Promise.all(promises);
      const elapsed = Date.now() - startTime;
      
      expect(elapsed).toBeLessThan(5000);
    });
  });
});