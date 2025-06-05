/**
 * 構造化ログの実装
 */

import { Logger } from './types';

export class StructuredLogger implements Logger {
  private serviceName: string;

  constructor(serviceName: string = 'audio-workflow-engine') {
    this.serviceName = serviceName;
  }

  private formatLog(level: string, message: string, meta?: any): string {
    const log = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      ...meta
    };
    return JSON.stringify(log);
  }

  info(message: string, meta?: any): void {
    console.log(this.formatLog('info', message, meta));
  }

  error(message: string, error?: Error, meta?: any): void {
    const errorMeta = error ? {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    } : {};
    console.error(this.formatLog('error', message, { ...errorMeta, ...meta }));
  }

  warn(message: string, meta?: any): void {
    console.warn(this.formatLog('warn', message, meta));
  }

  debug(message: string, meta?: any): void {
    if (process.env.DEBUG) {
      console.debug(this.formatLog('debug', message, meta));
    }
  }
}

/**
 * 相関ID付きロガー
 */
export class CorrelatedLogger implements Logger {
  private logger: Logger;
  private correlationId: string;

  constructor(logger: Logger, correlationId: string) {
    this.logger = logger;
    this.correlationId = correlationId;
  }

  private addCorrelationId(meta?: any): any {
    return {
      correlationId: this.correlationId,
      ...meta
    };
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, this.addCorrelationId(meta));
  }

  error(message: string, error?: Error, meta?: any): void {
    this.logger.error(message, error, this.addCorrelationId(meta));
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, this.addCorrelationId(meta));
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, this.addCorrelationId(meta));
  }
}