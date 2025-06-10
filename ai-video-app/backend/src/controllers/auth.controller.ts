import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from '../services/auth.service';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      // Check if user already exists
      const existingUser = await this.authService.findUserByEmail(email);
      if (existingUser) {
        throw new ApiError(400, 'このメールアドレスは既に登録されています');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '12'));

      // Create user
      const user = await this.authService.createUser({
        email,
        passwordHash,
        emailVerificationToken: uuidv4(),
      });

      // Send verification email (mock in MVP)
      logger.info(`Verification email would be sent to ${email}`);

      res.status(201).json({
        success: true,
        message: '登録が完了しました。メールを確認してください。',
        data: {
          userId: user.id,
          email: user.email,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await this.authService.findUserByEmail(email);
      if (!user) {
        throw new ApiError(401, 'メールアドレスまたはパスワードが正しくありません');
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        throw new ApiError(401, 'メールアドレスまたはパスワードが正しくありません');
      }

      // Check if email is verified
      if (!user.email_verified) {
        throw new ApiError(403, 'メールアドレスの確認が必要です');
      }

      // Generate tokens
      const accessToken = this.authService.generateAccessToken(user);
      const refreshToken = await this.authService.generateRefreshToken(user);

      // Log audit
      await this.authService.logAudit(user.id, 'login', req.ip);

      res.json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            planType: user.plan_type,
            ageVerified: user.age_verified,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      const tokens = await this.authService.refreshAccessToken(refreshToken);

      res.json({
        success: true,
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // In a real app, you might want to invalidate the refresh token
      await this.authService.logAudit(req.user!.userId, 'logout', req.ip);

      res.json({
        success: true,
        message: 'ログアウトしました',
      });
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;

      await this.authService.initiatePasswordReset(email);

      // Always return success to prevent email enumeration
      res.json({
        success: true,
        message: 'パスワードリセットのメールを送信しました',
      });
    } catch (error) {
      // Log error but don't expose it
      logger.error('Password reset error:', error);
      res.json({
        success: true,
        message: 'パスワードリセットのメールを送信しました',
      });
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, password } = req.body;

      await this.authService.resetPassword(token, password);

      res.json({
        success: true,
        message: 'パスワードがリセットされました',
      });
    } catch (error) {
      next(error);
    }
  };

  verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;

      await this.authService.verifyEmail(token);

      res.json({
        success: true,
        message: 'メールアドレスが確認されました',
      });
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user!.userId;

      await this.authService.changePassword(userId, currentPassword, newPassword);

      res.json({
        success: true,
        message: 'パスワードが変更されました',
      });
    } catch (error) {
      next(error);
    }
  };

  getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      const user = await this.authService.getUserProfile(userId);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  verifyAge = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      
      // In a real app, this would integrate with an age verification service
      // For MVP, we'll just update the flag
      await this.authService.updateAgeVerification(userId, true);

      res.json({
        success: true,
        message: '年齢確認が完了しました',
      });
    } catch (error) {
      next(error);
    }
  };
}