import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { query } from '../database/connection';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Validation middleware
const validateRequest = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Get current user profile
router.get('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    
    const result = await query(
      `SELECT 
        id, email, username, full_name, role, plan_type, plan_expires_at,
        usage_count, usage_limit, email_verified, last_login_at, created_at
       FROM users WHERE id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get additional stats
    const statsResult = await query(`
      SELECT 
        (SELECT COUNT(*) FROM video_views WHERE user_id = $1) as videos_watched,
        (SELECT COUNT(*) FROM video_views WHERE user_id = $1 AND completed = true) as videos_completed,
        (SELECT COUNT(*) FROM favorites WHERE user_id = $1) as favorites_count,
        (SELECT COUNT(*) FROM video_likes vl JOIN videos v ON vl.video_id = v.id WHERE vl.user_id = $1) as likes_given
    `, [userId]);
    
    const user = result.rows[0];
    const stats = statsResult.rows[0];
    
    res.json({
      ...user,
      stats: {
        videos_watched: parseInt(stats.videos_watched),
        videos_completed: parseInt(stats.videos_completed),
        favorites_count: parseInt(stats.favorites_count),
        likes_given: parseInt(stats.likes_given),
      },
    });
  } catch (error) {
    logger.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put(
  '/profile',
  authenticateToken,
  [
    body('username').optional().isLength({ min: 3, max: 100 }),
    body('full_name').optional().isLength({ min: 2, max: 255 }),
  ],
  validateRequest,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { username, full_name } = req.body;
      
      // Check if username is taken
      if (username) {
        const existing = await query(
          'SELECT id FROM users WHERE username = $1 AND id != $2',
          [username, userId]
        );
        if (existing.rows.length > 0) {
          return res.status(400).json({ error: 'Username already taken' });
        }
      }
      
      // Build update query dynamically
      const updates = [];
      const values = [];
      let paramCount = 0;
      
      if (username) {
        paramCount++;
        updates.push(`username = $${paramCount}`);
        values.push(username);
      }
      
      if (full_name !== undefined) {
        paramCount++;
        updates.push(`full_name = $${paramCount}`);
        values.push(full_name);
      }
      
      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }
      
      paramCount++;
      values.push(userId);
      
      const result = await query(
        `UPDATE users SET ${updates.join(', ')}, updated_at = NOW()
         WHERE id = $${paramCount}
         RETURNING id, email, username, full_name, role, plan_type`,
        values
      );
      
      logger.info('Profile updated', { userId });
      res.json(result.rows[0]);
    } catch (error) {
      logger.error('Error updating profile:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

// Change password
router.put(
  '/change-password',
  authenticateToken,
  [
    body('current_password').notEmpty(),
    body('new_password').isLength({ min: 8 }),
  ],
  validateRequest,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { current_password, new_password } = req.body;
      
      // Get current password hash
      const result = await query(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Verify current password
      const validPassword = await bcrypt.compare(current_password, result.rows[0].password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      
      // Hash new password
      const newPasswordHash = await bcrypt.hash(new_password, 10);
      
      // Update password
      await query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [newPasswordHash, userId]
      );
      
      logger.info('Password changed', { userId });
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      logger.error('Error changing password:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
);

// Get user's usage statistics
router.get('/usage', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    
    // Get current month's usage
    const usageResult = await query(`
      SELECT 
        u.usage_count,
        u.usage_limit,
        u.plan_type,
        u.plan_expires_at,
        COUNT(DISTINCT vv.video_id) as videos_watched_this_month,
        SUM(vv.watch_duration_seconds) as total_watch_time_seconds
      FROM users u
      LEFT JOIN video_views vv ON u.id = vv.user_id 
        AND vv.created_at >= date_trunc('month', CURRENT_DATE)
      WHERE u.id = $1
      GROUP BY u.id, u.usage_count, u.usage_limit, u.plan_type, u.plan_expires_at
    `, [userId]);
    
    if (usageResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const usage = usageResult.rows[0];
    
    // Define plan limits
    const planLimits = {
      free: { monthly_videos: 5, quality: '480p' },
      standard: { monthly_videos: 20, quality: '720p' },
      premium: { monthly_videos: -1, quality: '4k' }, // -1 means unlimited
    };
    
    const currentPlanLimits = planLimits[usage.plan_type as keyof typeof planLimits];
    
    res.json({
      current_usage: {
        videos_watched: parseInt(usage.videos_watched_this_month) || 0,
        watch_time_hours: Math.round((parseInt(usage.total_watch_time_seconds) || 0) / 3600),
      },
      limits: {
        monthly_videos: currentPlanLimits.monthly_videos,
        max_quality: currentPlanLimits.quality,
      },
      plan: {
        type: usage.plan_type,
        expires_at: usage.plan_expires_at,
      },
      remaining: currentPlanLimits.monthly_videos === -1 
        ? 'unlimited' 
        : Math.max(0, currentPlanLimits.monthly_videos - (parseInt(usage.videos_watched_this_month) || 0)),
    });
  } catch (error) {
    logger.error('Error fetching usage:', error);
    res.status(500).json({ error: 'Failed to fetch usage' });
  }
});

// Delete account
router.delete('/account', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password required to delete account' });
    }
    
    // Verify password
    const result = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const validPassword = await bcrypt.compare(password, result.rows[0].password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    // Cancel any active subscriptions
    await query(
      'UPDATE subscriptions SET status = $1, canceled_at = NOW() WHERE user_id = $2 AND status = $3',
      ['canceled', userId, 'active']
    );
    
    // Soft delete user (in production, consider GDPR compliance)
    await query(
      'UPDATE users SET email = $1, username = $2, deleted_at = NOW() WHERE id = $3',
      [`deleted_${userId}@deleted.com`, `deleted_${userId}`, userId]
    );
    
    logger.info('Account deleted', { userId });
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    logger.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Get recommendations for user
router.get('/recommendations', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { limit = 10 } = req.query;
    
    // Get user's watch history to find preferred categories/creators
    const preferencesResult = await query(`
      SELECT 
        c.category_id,
        v.creator_id,
        COUNT(*) as watch_count
      FROM video_views vv
      JOIN videos v ON vv.video_id = v.id
      JOIN creators c ON v.creator_id = c.id
      WHERE vv.user_id = $1
      GROUP BY c.category_id, v.creator_id
      ORDER BY watch_count DESC
      LIMIT 5
    `, [userId]);
    
    const preferences = preferencesResult.rows;
    
    // Get recommended videos based on preferences
    let recommendQuery = `
      SELECT DISTINCT
        v.*,
        c.name as creator_name,
        c.thumbnail_url as creator_thumbnail,
        cat.name as category_name
      FROM videos v
      JOIN creators c ON v.creator_id = c.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN video_views vv ON v.id = vv.video_id AND vv.user_id = $1
      WHERE v.status = 'published'
        AND vv.video_id IS NULL
    `;
    
    const params: any[] = [userId];
    let paramCount = 1;
    
    if (preferences.length > 0) {
      const categoryIds = preferences.filter(p => p.category_id).map(p => p.category_id);
      const creatorIds = preferences.map(p => p.creator_id);
      
      if (categoryIds.length > 0) {
        paramCount++;
        recommendQuery += ` AND (c.category_id = ANY($${paramCount})`;
        params.push(categoryIds);
      }
      
      if (creatorIds.length > 0) {
        paramCount++;
        recommendQuery += categoryIds.length > 0 
          ? ` OR v.creator_id = ANY($${paramCount}))` 
          : ` AND v.creator_id = ANY($${paramCount})`;
        params.push(creatorIds);
      }
    }
    
    recommendQuery += ` ORDER BY v.view_count DESC, v.published_at DESC`;
    
    paramCount++;
    recommendQuery += ` LIMIT $${paramCount}`;
    params.push(limit);
    
    const result = await query(recommendQuery, params);
    
    res.json({
      recommendations: result.rows,
      based_on: preferences.length > 0 ? 'watch_history' : 'popular',
    });
  } catch (error) {
    logger.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

export default router;