/**
 * ロガーのユニットテスト
 */

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { StructuredLogger, CorrelatedLogger } from '../../src/audio-workflow/logger';

describe('StructuredLogger', () => {
  let logger: StructuredLogger;
  let consoleMocks: any;

  beforeEach(() => {
    logger = new StructuredLogger('test-service');
    
    // コンソールメソッドをモック
    consoleMocks = {
      log: mock(() => {}),
      error: mock(() => {}),
      warn: mock(() => {}),
      debug: mock(() => {})
    };
    
    global.console.log = consoleMocks.log;
    global.console.error = consoleMocks.error;
    global.console.warn = consoleMocks.warn;
    global.console.debug = consoleMocks.debug;
  });

  describe('info', () => {
    it('構造化されたログを出力する', () => {
      logger.info('Test message', { userId: 123 });

      expect(consoleMocks.log).toHaveBeenCalledTimes(1);
      const logOutput = consoleMocks.log.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);

      expect(parsed.level).toBe('info');
      expect(parsed.service).toBe('test-service');
      expect(parsed.message).toBe('Test message');
      expect(parsed.userId).toBe(123);
      expect(parsed.timestamp).toBeDefined();
    });
  });

  describe('error', () => {
    it('エラー情報を含む構造化ログを出力する', () => {
      const error = new Error('Test error');
      error.stack = 'Test stack trace';
      
      logger.error('Error occurred', error, { requestId: 'req-123' });

      expect(consoleMocks.error).toHaveBeenCalledTimes(1);
      const logOutput = consoleMocks.error.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);

      expect(parsed.level).toBe('error');
      expect(parsed.message).toBe('Error occurred');
      expect(parsed.error.name).toBe('Error');
      expect(parsed.error.message).toBe('Test error');
      expect(parsed.error.stack).toBe('Test stack trace');
      expect(parsed.requestId).toBe('req-123');
    });

    it('エラーなしでもログを出力できる', () => {
      logger.error('Error occurred', undefined, { code: 500 });

      expect(consoleMocks.error).toHaveBeenCalledTimes(1);
      const logOutput = consoleMocks.error.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);

      expect(parsed.error).toBeUndefined();
      expect(parsed.code).toBe(500);
    });
  });

  describe('warn', () => {
    it('警告ログを出力する', () => {
      logger.warn('Warning message', { threshold: 0.8 });

      expect(consoleMocks.warn).toHaveBeenCalledTimes(1);
      const logOutput = consoleMocks.warn.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);

      expect(parsed.level).toBe('warn');
      expect(parsed.message).toBe('Warning message');
      expect(parsed.threshold).toBe(0.8);
    });
  });

  describe('debug', () => {
    it('DEBUG環境変数が設定されている場合のみ出力する', () => {
      // DEBUG環境変数なし
      logger.debug('Debug message');
      expect(consoleMocks.debug).toHaveBeenCalledTimes(0);

      // DEBUG環境変数あり
      process.env.DEBUG = 'true';
      logger.debug('Debug message', { detail: 'test' });
      expect(consoleMocks.debug).toHaveBeenCalledTimes(1);

      const logOutput = consoleMocks.debug.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);
      expect(parsed.level).toBe('debug');
      expect(parsed.detail).toBe('test');

      // クリーンアップ
      delete process.env.DEBUG;
    });
  });
});

describe('CorrelatedLogger', () => {
  let baseLogger: StructuredLogger;
  let correlatedLogger: CorrelatedLogger;
  let consoleMocks: any;

  beforeEach(() => {
    baseLogger = new StructuredLogger('test-service');
    correlatedLogger = new CorrelatedLogger(baseLogger, 'corr-123');
    
    consoleMocks = {
      log: mock(() => {}),
      error: mock(() => {}),
      warn: mock(() => {}),
      debug: mock(() => {})
    };
    
    global.console.log = consoleMocks.log;
    global.console.error = consoleMocks.error;
    global.console.warn = consoleMocks.warn;
    global.console.debug = consoleMocks.debug;
  });

  it('すべてのログに相関IDを追加する', () => {
    correlatedLogger.info('Info message', { data: 'test' });

    expect(consoleMocks.log).toHaveBeenCalledTimes(1);
    const logOutput = consoleMocks.log.mock.calls[0][0];
    const parsed = JSON.parse(logOutput);

    expect(parsed.correlationId).toBe('corr-123');
    expect(parsed.data).toBe('test');
  });

  it('エラーログに相関IDを追加する', () => {
    const error = new Error('Test error');
    correlatedLogger.error('Error occurred', error);

    expect(consoleMocks.error).toHaveBeenCalledTimes(1);
    const logOutput = consoleMocks.error.mock.calls[0][0];
    const parsed = JSON.parse(logOutput);

    expect(parsed.correlationId).toBe('corr-123');
    expect(parsed.error.message).toBe('Test error');
  });

  it('既存のメタデータを上書きしない', () => {
    correlatedLogger.info('Message', { 
      correlationId: 'should-be-overwritten',
      customField: 'preserved' 
    });

    expect(consoleMocks.log).toHaveBeenCalledTimes(1);
    const logOutput = consoleMocks.log.mock.calls[0][0];
    const parsed = JSON.parse(logOutput);

    expect(parsed.correlationId).toBe('corr-123'); // 上書きされる
    expect(parsed.customField).toBe('preserved'); // 保持される
  });
});