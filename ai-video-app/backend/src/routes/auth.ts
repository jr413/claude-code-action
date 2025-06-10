import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

const router = Router();

// Validation middleware
const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Register endpoint
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('username').isLength({ min: 3 }).isAlphanumeric(),
    body('age_confirmed').isBoolean().equals('true').withMessage('年齢確認が必要です'),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password, username } = req.body;
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // TODO: Save user to database
      // For now, return mock response
      const mockUser = {
        id: '123',
        email,
        username,
        plan_type: 'free'
      };
      
      // Generate JWT
      const token = jwt.sign(
        { userId: mockUser.id },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      
      res.status(201).json({
        success: true,
        data: {
          user: mockUser,
          token
        }
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({ success: false, error: 'Registration failed' });
    }
  }
);

// Login endpoint
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // TODO: Fetch user from database and verify password
      // For now, return mock response
      const mockUser = {
        id: '123',
        email,
        username: 'testuser',
        plan_type: 'free'
      };
      
      // Generate JWT
      const token = jwt.sign(
        { userId: mockUser.id },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      
      res.json({
        success: true,
        data: {
          user: mockUser,
          token
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ success: false, error: 'Login failed' });
    }
  }
);

// Password reset request
router.post('/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  validate,
  async (req, res) => {
    try {
      // TODO: Implement password reset logic
      res.json({
        success: true,
        message: 'Password reset email sent'
      });
    } catch (error) {
      logger.error('Password reset error:', error);
      res.status(500).json({ success: false, error: 'Password reset failed' });
    }
  }
);

export default router;