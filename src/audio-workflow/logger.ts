import type { Logger } from './types';

export class StructuredLogger implements Logger {
  private correlationId?: string;
  private serviceName: string;

  constructor(serviceName: string = 'audio-workflow-engine') {
    this.serviceName = serviceName;
  }

  setCorrelationId(correlationId: string): void {
    this.correlationId = correlationId;
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log('INFO', message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log('WARN', message, metadata);
  }

  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log('ERROR', message, {
      ...metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.log('DEBUG', message, metadata);
  }

  private log(level: string, message: string, metadata?: Record<string, any>): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      correlationId: this.correlationId,
      message,
      ...metadata,
    };

    console.log(JSON.stringify(logEntry));
  }
}