import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../database/connection';
import { logger } from '../utils/logger';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Validation middleware
const validateRequest = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Register endpoint
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('full_name').optional().isLength({ min: 2 }),
    body('birthDate').isISO8601().withMessage('Valid birth date required'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { email, password, username, full_name, birthDate } = req.body;

      // Age verification
      const birthDateObj = new Date(birthDate);
      const age = Math.floor((Date.now() - birthDateObj.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 18) {
        return res.status(403).json({ error: 'Must be 18 or older to register' });
      }

      // Check if user exists
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1 OR username = $2',
        [email, username]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');

      // Create user
      const result = await query(
        `INSERT INTO users (email, password_hash, username, full_name, email_verification_token)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, username, role, plan_type`,
        [email, passwordHash, username, full_name, verificationToken]
      );

      const user = result.rows[0];

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      logger.info('New user registered', { userId: user.id, email: user.email });

      res.status(201).json({
        message: 'Registration successful',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          plan_type: user.plan_type,
        },
        token,
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// Login endpoint
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Get user
      const result = await query(
        'SELECT id, email, username, password_hash, role, plan_type, email_verified FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if email is verified
      if (!user.email_verified) {
        return res.status(403).json({ error: 'Please verify your email first' });
      }

      // Update last login
      await query(
        'UPDATE users SET last_login_at = NOW() WHERE id = $1',
        [user.id]
      );

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      logger.info('User logged in', { userId: user.id, email: user.email });

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          plan_type: user.plan_type,
        },
        token,
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// Verify email endpoint
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token required' });
    }

    const result = await query(
      'UPDATE users SET email_verified = true, email_verification_token = NULL WHERE email_verification_token = $1 RETURNING id, email',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    logger.info('Email verified', { userId: result.rows[0].id });
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    logger.error('Email verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Request password reset
router.post(
  '/request-password-reset',
  [body('email').isEmail().normalizeEmail()],
  validateRequest,
  async (req, res) => {
    try {
      const { email } = req.body;

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour

      const result = await query(
        'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE email = $3 RETURNING id',
        [resetToken, resetExpires, email]
      );

      if (result.rows.length > 0) {
        // In production, send email with reset link
        logger.info('Password reset requested', { email });
      }

      // Always return success to prevent email enumeration
      res.json({ message: 'If the email exists, a reset link has been sent' });
    } catch (error) {
      logger.error('Password reset request error:', error);
      res.status(500).json({ error: 'Request failed' });
    }
  }
);

// Reset password
router.post(
  '/reset-password',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { token, password } = req.body;

      // Find user with valid reset token
      const result = await query(
        'SELECT id FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
        [token]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      const userId = result.rows[0].id;
      const passwordHash = await bcrypt.hash(password, 10);

      // Update password and clear reset token
      await query(
        'UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2',
        [passwordHash, userId]
      );

      logger.info('Password reset completed', { userId });
      res.json({ message: 'Password reset successful' });
    } catch (error) {
      logger.error('Password reset error:', error);
      res.status(500).json({ error: 'Reset failed' });
    }
  }
);

// Refresh token endpoint
router.post('/refresh', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Invalid request' });
    }

    const token = jwt.sign(
      { userId: req.user.id, email: req.user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({ token });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({ error: 'Refresh failed' });
  }
});

// Logout endpoint
router.post('/logout', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // In a production app, you might want to invalidate the token here
    logger.info('User logged out', { userId: req.user?.id });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;