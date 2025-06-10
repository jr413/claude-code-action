import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import { query } from '../database/connection';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';
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

// Configure multer for video uploads (in production, use S3)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/videos/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_VIDEO_SIZE_MB || '1000') * 1024 * 1024, // MB to bytes
  },
  fileFilter: (req, file, cb) => {
    const allowedFormats = (process.env.ALLOWED_VIDEO_FORMATS || 'mp4,mov,avi,mkv').split(',');
    const ext = path.extname(file.originalname).toLowerCase().substring(1);
    
    if (allowedFormats.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File format not allowed. Allowed formats: ${allowedFormats.join(', ')}`));
    }
  },
});

// Get video stream (HLS manifest or direct video)
router.get('/stream/:videoId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user!.id;
    
    // Check if user has access to video
    const videoResult = await query(`
      SELECT v.*, c.plan_required as creator_plan
      FROM videos v
      JOIN creators c ON v.creator_id = c.id
      WHERE v.id = $1 AND v.status = 'published'
    `, [videoId]);
    
    if (videoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    const video = videoResult.rows[0];
    const requiredPlan = video.plan_required || video.creator_plan;
    
    // Check plan access
    if (requiredPlan !== 'free' && req.user?.plan_type === 'free') {
      return res.status(403).json({ 
        error: 'Upgrade required', 
        required_plan: requiredPlan 
      });
    }
    
    // Update last position if resuming
    const position = parseInt(req.query.position as string) || 0;
    if (position > 0) {
      await query(`
        UPDATE video_views 
        SET last_position_seconds = $1, updated_at = NOW()
        WHERE user_id = $2 AND video_id = $3
      `, [position, userId, videoId]);
    }
    
    // In production, return HLS manifest URL or signed S3 URL
    // For MVP, return mock video URL
    res.json({
      type: 'hls',
      url: video.hls_url || `https://example-cdn.com/videos/${videoId}/master.m3u8`,
      fallback_url: video.video_url || `https://example-cdn.com/videos/${videoId}/video.mp4`,
      duration: video.duration_seconds,
      quality: video.quality,
    });
  } catch (error) {
    logger.error('Error streaming video:', error);
    res.status(500).json({ error: 'Failed to stream video' });
  }
});

// Update video progress
router.post(
  '/progress/:videoId',
  authenticateToken,
  [
    param('videoId').isUUID(),
    body('position').isInt({ min: 0 }),
    body('duration').isInt({ min: 0 }),
  ],
  validateRequest,
  async (req: AuthRequest, res) => {
    try {
      const { videoId } = req.params;
      const { position, duration } = req.body;
      const userId = req.user!.id;
      
      // Calculate if video is completed (watched > 90%)
      const completed = position / duration >= 0.9;
      
      await query(`
        INSERT INTO video_views 
        (user_id, video_id, watch_duration_seconds, last_position_seconds, completed)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, video_id) DO UPDATE
        SET watch_duration_seconds = video_views.watch_duration_seconds + EXCLUDED.watch_duration_seconds,
            last_position_seconds = EXCLUDED.last_position_seconds,
            completed = EXCLUDED.completed OR video_views.completed,
            updated_at = NOW()
      `, [userId, videoId, position, position, completed]);
      
      res.json({ success: true });
    } catch (error) {
      logger.error('Error updating video progress:', error);
      res.status(500).json({ error: 'Failed to update progress' });
    }
  }
);

// Get user's watch history
router.get('/history', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    const result = await query(`
      SELECT 
        vv.*,
        v.title,
        v.slug,
        v.thumbnail_url,
        v.duration_seconds,
        v.quality,
        c.name as creator_name,
        c.thumbnail_url as creator_thumbnail
      FROM video_views vv
      JOIN videos v ON vv.video_id = v.id
      JOIN creators c ON v.creator_id = c.id
      WHERE vv.user_id = $1
      ORDER BY vv.updated_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);
    
    const countResult = await query(
      'SELECT COUNT(*) FROM video_views WHERE user_id = $1',
      [userId]
    );
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      history: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Error fetching watch history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Like/unlike video
router.post('/like/:videoId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user!.id;
    
    // Check if already liked
    const existing = await query(
      'SELECT id FROM video_likes WHERE user_id = $1 AND video_id = $2',
      [userId, videoId]
    );
    
    if (existing.rows.length > 0) {
      // Unlike
      await query(
        'DELETE FROM video_likes WHERE user_id = $1 AND video_id = $2',
        [userId, videoId]
      );
      res.json({ liked: false });
    } else {
      // Like
      await query(
        'INSERT INTO video_likes (user_id, video_id) VALUES ($1, $2)',
        [userId, videoId]
      );
      res.json({ liked: true });
    }
  } catch (error) {
    logger.error('Error toggling like:', error);
    res.status(500).json({ error: 'Failed to update like status' });
  }
});

// Add to favorites
router.post('/favorite/:videoId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user!.id;
    
    // Check if already favorited
    const existing = await query(
      'SELECT id FROM favorites WHERE user_id = $1 AND video_id = $2',
      [userId, videoId]
    );
    
    if (existing.rows.length > 0) {
      // Remove from favorites
      await query(
        'DELETE FROM favorites WHERE user_id = $1 AND video_id = $2',
        [userId, videoId]
      );
      res.json({ favorited: false });
    } else {
      // Add to favorites
      await query(
        'INSERT INTO favorites (user_id, video_id) VALUES ($1, $2)',
        [userId, videoId]
      );
      res.json({ favorited: true });
    }
  } catch (error) {
    logger.error('Error toggling favorite:', error);
    res.status(500).json({ error: 'Failed to update favorite status' });
  }
});

// Get user's favorites
router.get('/favorites', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    const result = await query(`
      SELECT 
        f.*,
        v.title,
        v.slug,
        v.thumbnail_url,
        v.duration_seconds,
        v.quality,
        v.view_count,
        v.like_count,
        c.name as creator_name,
        c.thumbnail_url as creator_thumbnail
      FROM favorites f
      JOIN videos v ON f.video_id = v.id
      JOIN creators c ON v.creator_id = c.id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);
    
    const countResult = await query(
      'SELECT COUNT(*) FROM favorites WHERE user_id = $1',
      [userId]
    );
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      favorites: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// Admin: Upload video
router.post(
  '/upload',
  authenticateToken,
  requireRole(['admin']),
  upload.single('video'),
  [
    body('title').notEmpty().isLength({ max: 300 }),
    body('description').optional(),
    body('creator_id').isUUID(),
    body('plan_required').isIn(['free', 'standard', 'premium']),
    body('quality').isIn(['480p', '720p', '1080p', '4k']),
    body('tags').optional().isArray(),
  ],
  validateRequest,
  async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Video file required' });
      }
      
      const {
        title,
        description,
        creator_id,
        plan_required,
        quality,
        tags,
      } = req.body;
      
      // Generate slug from title
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
      
      // In production, upload to S3 and get URLs
      const videoUrl = `/uploads/videos/${req.file.filename}`;
      const thumbnailUrl = `/uploads/thumbnails/default.jpg`; // Generate thumbnail
      
      const result = await query(
        `INSERT INTO videos 
         (title, slug, description, creator_id, thumbnail_url, video_url, 
          duration_seconds, file_size_bytes, quality, plan_required, tags, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'draft')
         RETURNING *`,
        [
          title,
          slug,
          description,
          creator_id,
          thumbnailUrl,
          videoUrl,
          0, // Calculate duration
          req.file.size,
          quality,
          plan_required,
          tags || [],
        ]
      );
      
      logger.info('Video uploaded', { videoId: result.rows[0].id });
      res.status(201).json(result.rows[0]);
    } catch (error) {
      logger.error('Error uploading video:', error);
      res.status(500).json({ error: 'Failed to upload video' });
    }
  }
);

// Admin: Publish video
router.put(
  '/publish/:videoId',
  authenticateToken,
  requireRole(['admin']),
  async (req: AuthRequest, res) => {
    try {
      const { videoId } = req.params;
      
      const result = await query(
        `UPDATE videos 
         SET status = 'published', published_at = NOW()
         WHERE id = $1 AND status = 'draft'
         RETURNING *`,
        [videoId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Video not found or already published' });
      }
      
      logger.info('Video published', { videoId });
      res.json(result.rows[0]);
    } catch (error) {
      logger.error('Error publishing video:', error);
      res.status(500).json({ error: 'Failed to publish video' });
    }
  }
);

export default router;