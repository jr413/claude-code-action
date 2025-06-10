import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../database/connection';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    plan_type: string;
  };
}

export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret',
      async (err: any, decoded: any) => {
        if (err) {
          logger.warn('Invalid token attempt', { error: err.message });
          res.status(403).json({ error: 'Invalid or expired token' });
          return;
        }

        try {
          // Verify user still exists and is active
          const result = await query(
            'SELECT id, email, role, plan_type FROM users WHERE id = $1',
            [decoded.userId]
          );

          if (result.rows.length === 0) {
            res.status(403).json({ error: 'User not found' });
            return;
          }

          const user = result.rows[0];
          req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            plan_type: user.plan_type,
          };

          next();
        } catch (dbError) {
          logger.error('Database error in auth middleware:', dbError);
          res.status(500).json({ error: 'Internal server error' });
        }
      }
    );
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

export function requirePlan(plans: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!plans.includes(req.user.plan_type)) {
      res.status(403).json({ 
        error: 'Upgrade required', 
        required_plan: plans[0] 
      });
      return;
    }

    next();
  };
}