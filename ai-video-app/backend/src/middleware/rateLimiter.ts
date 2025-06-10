import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'リクエストが多すぎます。しばらくしてからもう一度お試しください。',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests',
      message: 'リクエストが多すぎます。しばらくしてからもう一度お試しください。',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

export const strictRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: 'リクエストが多すぎます。1分後にもう一度お試しください。',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'ログイン試行回数が多すぎます。15分後にもう一度お試しください。',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});