import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const isOperational = err.isOperational || false;

  logger.error({
    error: {
      message: err.message,
      stack: err.stack,
      statusCode,
      isOperational,
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && !isOperational) {
    res.status(statusCode).json({
      success: false,
      error: 'Something went wrong',
      requestId: res.locals.requestId,
    });
  } else {
    res.status(statusCode).json({
      success: false,
      error: message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      requestId: res.locals.requestId,
    });
  }
};

export class ApiError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}