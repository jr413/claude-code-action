import { describe, test, expect } from 'bun:test';
import { TeleAIAuth } from '../src/teleai/auth';
import { AuthenticationError } from '../src/teleai/types';

describe('TeleAIAuth', () => {
  test('should create auth instance with valid API key', () => {
    const auth = new TeleAIAuth('test-api-key');
    expect(auth).toBeDefined();
  });

  test('should throw error when API key is empty', () => {
    expect(() => new TeleAIAuth('')).toThrow(AuthenticationError);
    expect(() => new TeleAIAuth('')).toThrow('API key is required');
  });

  test('should throw error when API key is undefined', () => {
    expect(() => new TeleAIAuth(undefined as any)).toThrow(AuthenticationError);
  });

  test('should return correct headers', () => {
    const auth = new TeleAIAuth('test-api-key');
    const headers = auth.getHeaders();
    
    expect(headers).toEqual({
      'Authorization': 'Bearer test-api-key',
      'Content-Type': 'application/json'
    });
  });

  test('should validate valid API key', () => {
    const auth = new TeleAIAuth('test-api-key');
    expect(() => auth.validateApiKey()).not.toThrow();
  });

  test('should throw error for invalid API key during validation', () => {
    const auth = new TeleAIAuth('   ');
    expect(() => auth.validateApiKey()).toThrow(AuthenticationError);
    expect(() => auth.validateApiKey()).toThrow('Invalid API key');
  });
});