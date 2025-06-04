import { describe, test, expect, beforeEach, spyOn } from 'bun:test';
import { StructuredLogger } from '../../src/audio-workflow/logger';

describe('StructuredLogger', () => {
  let logger: StructuredLogger;
  let consoleSpy: any;

  beforeEach(() => {
    logger = new StructuredLogger('TestService');
  });

  test('should format log with correct structure', () => {
    const logs: any[] = [];
    consoleSpy = spyOn(console, 'log').mockImplementation((log) => {
      logs.push(JSON.parse(log));
    });

    logger.info('Test message', { userId: '123' });

    expect(logs).toHaveLength(1);
    const log = logs[0];
    
    expect(log.level).toBe('info');
    expect(log.service).toBe('TestService');
    expect(log.message).toBe('Test message');
    expect(log.userId).toBe('123');
    expect(log.timestamp).toBeDefined();
    expect(log.correlationId).toBe('system');
  });

  test('should use provided correlationId', () => {
    const logs: any[] = [];
    consoleSpy = spyOn(console, 'log').mockImplementation((log) => {
      logs.push(JSON.parse(log));
    });

    logger.info('Test message', { correlationId: 'custom-123' });

    const log = logs[0];
    expect(log.correlationId).toBe('custom-123');
  });

  test('should handle different log levels', () => {
    const logs: any[] = [];
    const errors: any[] = [];
    const warnings: any[] = [];

    spyOn(console, 'log').mockImplementation((log) => logs.push(JSON.parse(log)));
    spyOn(console, 'error').mockImplementation((log) => errors.push(JSON.parse(log)));
    spyOn(console, 'warn').mockImplementation((log) => warnings.push(JSON.parse(log)));

    logger.info('Info message');
    logger.error('Error message');
    logger.warn('Warning message');

    expect(logs[0].level).toBe('info');
    expect(errors[0].level).toBe('error');
    expect(warnings[0].level).toBe('warn');
  });

  test('should not log debug messages when DEBUG is not set', () => {
    const logs: any[] = [];
    spyOn(console, 'debug').mockImplementation((log) => logs.push(JSON.parse(log)));

    const originalDebug = process.env.DEBUG;
    delete process.env.DEBUG;

    logger.debug('Debug message');

    expect(logs).toHaveLength(0);

    // Restore original value
    if (originalDebug) {
      process.env.DEBUG = originalDebug;
    }
  });

  test('should log debug messages when DEBUG is set', () => {
    const logs: any[] = [];
    spyOn(console, 'debug').mockImplementation((log) => logs.push(JSON.parse(log)));

    const originalDebug = process.env.DEBUG;
    process.env.DEBUG = 'true';

    logger.debug('Debug message');

    expect(logs).toHaveLength(1);
    expect(logs[0].level).toBe('debug');

    // Restore original value
    if (originalDebug) {
      process.env.DEBUG = originalDebug;
    } else {
      delete process.env.DEBUG;
    }
  });
});