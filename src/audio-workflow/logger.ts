import { Logger } from './types';

export class StructuredLogger implements Logger {
  private serviceName: string;

  constructor(serviceName: string = 'audio-workflow') {
    this.serviceName = serviceName;
  }

  private formatLog(level: string, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    const correlationId = meta?.correlationId || 'system';
    
    return {
      timestamp,
      level,
      service: this.serviceName,
      correlationId,
      message,
      ...meta
    };
  }

  info(message: string, meta?: any): void {
    console.log(JSON.stringify(this.formatLog('info', message, meta)));
  }

  error(message: string, meta?: any): void {
    console.error(JSON.stringify(this.formatLog('error', message, meta)));
  }

  warn(message: string, meta?: any): void {
    console.warn(JSON.stringify(this.formatLog('warn', message, meta)));
  }

  debug(message: string, meta?: any): void {
    if (process.env.DEBUG) {
      console.debug(JSON.stringify(this.formatLog('debug', message, meta)));
    }
  }
}