import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from './errorHandler';
import { query } from '../config/database';

interface JwtPayload {
  userId: string;
  email: string;
  planType: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, '認証が必要です');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // Check if user exists and is active
    const result = await query(
      'SELECT id, email, plan_type, deleted_at FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0 || result.rows[0].deleted_at) {
      throw new ApiError(401, 'ユーザーが見つかりません');
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      planType: result.rows[0].plan_type,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError(401, '無効なトークンです'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new ApiError(401, 'トークンの有効期限が切れています'));
    } else {
      next(error);
    }
  }
};

export const requirePlan = (requiredPlans: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, '認証が必要です'));
    }

    if (!requiredPlans.includes(req.user.planType)) {
      return next(new ApiError(403, 'このプランではアクセスできません'));
    }

    next();
  };
};

export const requireAgeVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, '認証が必要です'));
    }

    const result = await query(
      'SELECT age_verified FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0 || !result.rows[0].age_verified) {
      return next(new ApiError(403, '年齢確認が必要です'));
    }

    next();
  } catch (error) {
    next(error);
  }
};