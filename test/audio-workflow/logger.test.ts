import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { StructuredLogger } from '../../src/audio-workflow/logger';

describe('StructuredLogger', () => {
  let logger: StructuredLogger;
  let consoleSpy: any;
  let originalConsoleLog: any;

  beforeEach(() => {
    logger = new StructuredLogger('test-service');
    originalConsoleLog = console.log;
    consoleSpy = spyOn(console, 'log');
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  describe('logging methods', () => {
    it('should log info messages', () => {
      logger.info('Test info message', { userId: 123 });
      
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const logEntry = JSON.parse(consoleSpy.mock.calls[0][0]);
      
      expect(logEntry.level).toBe('INFO');
      expect(logEntry.message).toBe('Test info message');
      expect(logEntry.service).toBe('test-service');
      expect(logEntry.userId).toBe(123);
      expect(logEntry.timestamp).toBeDefined();
    });

    it('should log warn messages', () => {
      logger.warn('Test warning message', { code: 'WARN001' });
      
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const logEntry = JSON.parse(consoleSpy.mock.calls[0][0]);
      
      expect(logEntry.level).toBe('WARN');
      expect(logEntry.message).toBe('Test warning message');
      expect(logEntry.code).toBe('WARN001');
    });

    it('should log error messages with error object', () => {
      const error = new Error('Test error');
      logger.error('Test error message', error, { requestId: 'abc123' });
      
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const logEntry = JSON.parse(consoleSpy.mock.calls[0][0]);
      
      expect(logEntry.level).toBe('ERROR');
      expect(logEntry.message).toBe('Test error message');
      expect(logEntry.requestId).toBe('abc123');
      expect(logEntry.error).toBeDefined();
      expect(logEntry.error.name).toBe('Error');
      expect(logEntry.error.message).toBe('Test error');
      expect(logEntry.error.stack).toBeDefined();
    });

    it('should log error messages without error object', () => {
      logger.error('Test error message', undefined, { code: 'ERR001' });
      
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const logEntry = JSON.parse(consoleSpy.mock.calls[0][0]);
      
      expect(logEntry.level).toBe('ERROR');
      expect(logEntry.message).toBe('Test error message');
      expect(logEntry.code).toBe('ERR001');
      expect(logEntry.error).toBeUndefined();
    });

    it('should log debug messages', () => {
      logger.debug('Test debug message', { debugInfo: 'value' });
      
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const logEntry = JSON.parse(consoleSpy.mock.calls[0][0]);
      
      expect(logEntry.level).toBe('DEBUG');
      expect(logEntry.message).toBe('Test debug message');
      expect(logEntry.debugInfo).toBe('value');
    });
  });

  describe('correlation ID', () => {
    it('should include correlation ID when set', () => {
      logger.setCorrelationId('corr-123');
      logger.info('Test message');
      
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const logEntry = JSON.parse(consoleSpy.mock.calls[0][0]);
      
      expect(logEntry.correlationId).toBe('corr-123');
    });

    it('should not include correlation ID when not set', () => {
      logger.info('Test message');
      
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const logEntry = JSON.parse(consoleSpy.mock.calls[0][0]);
      
      expect(logEntry.correlationId).toBeUndefined();
    });

    it('should update correlation ID', () => {
      logger.setCorrelationId('corr-123');
      logger.info('First message');
      
      logger.setCorrelationId('corr-456');
      logger.info('Second message');
      
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      const firstLog = JSON.parse(consoleSpy.mock.calls[0][0]);
      const secondLog = JSON.parse(consoleSpy.mock.calls[1][0]);
      
      expect(firstLog.correlationId).toBe('corr-123');
      expect(secondLog.correlationId).toBe('corr-456');
    });
  });

  describe('metadata handling', () => {
    it('should merge metadata with log entry', () => {
      logger.info('Test message', {
        userId: 123,
        action: 'login',
        nested: { value: 'test' }
      });
      
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const logEntry = JSON.parse(consoleSpy.mock.calls[0][0]);
      
      expect(logEntry.userId).toBe(123);
      expect(logEntry.action).toBe('login');
      expect(logEntry.nested).toEqual({ value: 'test' });
    });

    it('should handle empty metadata', () => {
      logger.info('Test message');
      
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const logEntry = JSON.parse(consoleSpy.mock.calls[0][0]);
      
      expect(Object.keys(logEntry)).toContain('timestamp');
      expect(Object.keys(logEntry)).toContain('level');
      expect(Object.keys(logEntry)).toContain('service');
      expect(Object.keys(logEntry)).toContain('message');
    });
  });

  describe('service name', () => {
    it('should use custom service name', () => {
      const customLogger = new StructuredLogger('custom-service');
      customLogger.info('Test message');
      
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const logEntry = JSON.parse(consoleSpy.mock.calls[0][0]);
      
      expect(logEntry.service).toBe('custom-service');
    });

    it('should use default service name', () => {
      const defaultLogger = new StructuredLogger();
      defaultLogger.info('Test message');
      
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const logEntry = JSON.parse(consoleSpy.mock.calls[0][0]);
      
      expect(logEntry.service).toBe('audio-workflow-engine');
    });
  });
});