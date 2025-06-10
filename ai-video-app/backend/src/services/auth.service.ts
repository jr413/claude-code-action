import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

interface User {
  id: string;
  email: string;
  password_hash: string;
  plan_type: string;
  age_verified: boolean;
  email_verified: boolean;
}

interface CreateUserData {
  email: string;
  passwordHash: string;
  emailVerificationToken: string;
}

export class AuthService {
  async findUserByEmail(email: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email]
    );
    return result.rows[0] || null;
  }

  async findUserById(id: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] || null;
  }

  async createUser(data: CreateUserData): Promise<User> {
    const result = await query(
      `INSERT INTO users (email, password_hash, email_verification_token)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [data.email, data.passwordHash, data.emailVerificationToken]
    );
    return result.rows[0];
  }

  generateAccessToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        planType: user.plan_type,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      }
    );
  }

  async generateRefreshToken(user: User): Promise<string> {
    const token = uuidv4();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt]
    );

    return token;
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const result = await query(
      `SELECT rt.*, u.* 
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token_hash = $1 AND rt.expires_at > NOW()`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      throw new ApiError(401, '無効なリフレッシュトークンです');
    }

    const user = result.rows[0];

    // Delete old refresh token
    await query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);

    // Generate new tokens
    const accessToken = this.generateAccessToken(user);
    const newRefreshToken = await this.generateRefreshToken(user);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async initiatePasswordReset(email: string): Promise<void> {
    const user = await this.findUserByEmail(email);
    if (!user) {
      // Don't reveal that the user doesn't exist
      return;
    }

    const resetToken = uuidv4();
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour

    await query(
      `UPDATE users 
       SET password_reset_token = $1, password_reset_expires = $2
       WHERE id = $3`,
      [resetToken, resetExpires, user.id]
    );

    // In a real app, send email here
    logger.info(`Password reset email would be sent to ${email} with token ${resetToken}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const result = await query(
      `SELECT id FROM users 
       WHERE password_reset_token = $1 
       AND password_reset_expires > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      throw new ApiError(400, '無効または期限切れのトークンです');
    }

    const userId = result.rows[0].id;
    const passwordHash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS || '12'));

    await query(
      `UPDATE users 
       SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL
       WHERE id = $2`,
      [passwordHash, userId]
    );
  }

  async verifyEmail(token: string): Promise<void> {
    const result = await query(
      `UPDATE users 
       SET email_verified = true, email_verification_token = NULL
       WHERE email_verification_token = $1 AND email_verified = false
       RETURNING id`,
      [token]
    );

    if (result.rows.length === 0) {
      throw new ApiError(400, '無効な確認トークンです');
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new ApiError(404, 'ユーザーが見つかりません');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      throw new ApiError(401, '現在のパスワードが正しくありません');
    }

    const passwordHash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS || '12'));

    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, userId]
    );
  }

  async getUserProfile(userId: string): Promise<any> {
    const result = await query(
      `SELECT u.id, u.email, u.plan_type, u.usage_count, u.usage_limit, 
              u.age_verified, u.created_at,
              COUNT(DISTINCT us.id) as total_sessions,
              MAX(us.created_at) as last_session_at
       FROM users u
       LEFT JOIN user_sessions us ON u.id = us.user_id
       WHERE u.id = $1 AND u.deleted_at IS NULL
       GROUP BY u.id`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, 'ユーザーが見つかりません');
    }

    return result.rows[0];
  }

  async updateAgeVerification(userId: string, verified: boolean): Promise<void> {
    await query(
      'UPDATE users SET age_verified = $1, age_verified_at = $2 WHERE id = $3',
      [verified, verified ? new Date() : null, userId]
    );
  }

  async logAudit(userId: string, action: string, ipAddress?: string): Promise<void> {
    await query(
      'INSERT INTO audit_logs (user_id, action, ip_address) VALUES ($1, $2, $3)',
      [userId, action, ipAddress]
    );
  }
}