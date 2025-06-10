import { Router } from 'express';
import { body, param, query as queryValidator, validationResult } from 'express-validator';
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

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM categories WHERE is_active = true ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get all creators with optional filters
router.get(
  '/creators',
  [
    queryValidator('category').optional().isUUID(),
    queryValidator('featured').optional().isBoolean(),
    queryValidator('plan').optional().isIn(['free', 'standard', 'premium']),
    queryValidator('page').optional().isInt({ min: 1 }),
    queryValidator('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { category, featured, plan, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      let queryText = `
        SELECT c.*, cat.name as category_name
        FROM creators c
        LEFT JOIN categories cat ON c.category_id = cat.id
        WHERE c.is_active = true
      `;
      const params: any[] = [];
      let paramCount = 0;

      if (category) {
        paramCount++;
        queryText += ` AND c.category_id = $${paramCount}`;
        params.push(category);
      }

      if (featured !== undefined) {
        paramCount++;
        queryText += ` AND c.is_featured = $${paramCount}`;
        params.push(featured === 'true');
      }

      if (plan) {
        paramCount++;
        queryText += ` AND c.plan_required = $${paramCount}`;
        params.push(plan);
      }

      queryText += ` ORDER BY c.is_featured DESC, c.created_at DESC`;
      
      paramCount++;
      queryText += ` LIMIT $${paramCount}`;
      params.push(limit);
      
      paramCount++;
      queryText += ` OFFSET $${paramCount}`;
      params.push(offset);

      const result = await query(queryText, params);
      
      // Get total count
      let countQuery = `
        SELECT COUNT(*) FROM creators c
        WHERE c.is_active = true
      `;
      const countParams: any[] = [];
      let countParamCount = 0;

      if (category) {
        countParamCount++;
        countQuery += ` AND c.category_id = $${countParamCount}`;
        countParams.push(category);
      }

      if (featured !== undefined) {
        countParamCount++;
        countQuery += ` AND c.is_featured = $${countParamCount}`;
        countParams.push(featured === 'true');
      }

      if (plan) {
        countParamCount++;
        countQuery += ` AND c.plan_required = $${countParamCount}`;
        countParams.push(plan);
      }

      const countResult = await query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);

      res.json({
        creators: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Error fetching creators:', error);
      res.status(500).json({ error: 'Failed to fetch creators' });
    }
  }
);

// Get single creator by ID or slug
router.get('/creators/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Check if identifier is UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    
    const queryText = `
      SELECT c.*, cat.name as category_name
      FROM creators c
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.is_active = true AND ${isUUID ? 'c.id' : 'c.slug'} = $1
    `;
    
    const result = await query(queryText, [identifier]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Creator not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error fetching creator:', error);
    res.status(500).json({ error: 'Failed to fetch creator' });
  }
});

// Get videos with filters
router.get(
  '/videos',
  [
    queryValidator('creator').optional().isUUID(),
    queryValidator('category').optional().isUUID(),
    queryValidator('plan').optional().isIn(['free', 'standard', 'premium']),
    queryValidator('status').optional().isIn(['draft', 'published', 'archived']),
    queryValidator('search').optional().isString(),
    queryValidator('page').optional().isInt({ min: 1 }),
    queryValidator('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { 
        creator, 
        category, 
        plan, 
        status = 'published', 
        search,
        page = 1, 
        limit = 20 
      } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      
      let queryText = `
        SELECT v.*, c.name as creator_name, c.thumbnail_url as creator_thumbnail
        FROM videos v
        JOIN creators c ON v.creator_id = c.id
        WHERE v.status = $1
      `;
      const params: any[] = [status];
      let paramCount = 1;

      if (creator) {
        paramCount++;
        queryText += ` AND v.creator_id = $${paramCount}`;
        params.push(creator);
      }

      if (category) {
        paramCount++;
        queryText += ` AND c.category_id = $${paramCount}`;
        params.push(category);
      }

      if (plan) {
        paramCount++;
        queryText += ` AND v.plan_required = $${paramCount}`;
        params.push(plan);
      }

      if (search) {
        paramCount++;
        queryText += ` AND (v.title ILIKE $${paramCount} OR v.description ILIKE $${paramCount})`;
        params.push(`%${search}%`);
      }

      queryText += ` ORDER BY v.published_at DESC`;
      
      paramCount++;
      queryText += ` LIMIT $${paramCount}`;
      params.push(limit);
      
      paramCount++;
      queryText += ` OFFSET $${paramCount}`;
      params.push(offset);

      const result = await query(queryText, params);
      
      // Get total count
      let countQuery = `
        SELECT COUNT(*) FROM videos v
        JOIN creators c ON v.creator_id = c.id
        WHERE v.status = $1
      `;
      const countParams: any[] = [status];
      let countParamCount = 1;

      if (creator) {
        countParamCount++;
        countQuery += ` AND v.creator_id = $${countParamCount}`;
        countParams.push(creator);
      }

      if (category) {
        countParamCount++;
        countQuery += ` AND c.category_id = $${countParamCount}`;
        countParams.push(category);
      }

      if (plan) {
        countParamCount++;
        countQuery += ` AND v.plan_required = $${countParamCount}`;
        countParams.push(plan);
      }

      if (search) {
        countParamCount++;
        countQuery += ` AND (v.title ILIKE $${countParamCount} OR v.description ILIKE $${countParamCount})`;
        countParams.push(`%${search}%`);
      }

      const countResult = await query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);

      res.json({
        videos: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Error fetching videos:', error);
      res.status(500).json({ error: 'Failed to fetch videos' });
    }
  }
);

// Get single video
router.get('/videos/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT v.*, c.name as creator_name, c.thumbnail_url as creator_thumbnail
      FROM videos v
      JOIN creators c ON v.creator_id = c.id
      WHERE v.id = $1 AND v.status = 'published'
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    const video = result.rows[0];
    
    // Check if user has required plan
    if (video.plan_required !== 'free' && req.user?.plan_type === 'free') {
      return res.status(403).json({ 
        error: 'Upgrade required', 
        required_plan: video.plan_required 
      });
    }
    
    // Track video view
    if (req.user) {
      await query(`
        INSERT INTO video_views (user_id, video_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, video_id) DO UPDATE
        SET updated_at = NOW()
      `, [req.user.id, id]);
    }
    
    res.json(video);
  } catch (error) {
    logger.error('Error fetching video:', error);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

// Admin routes for content management
router.post(
  '/categories',
  authenticateToken,
  requireRole(['admin']),
  [
    body('name').notEmpty().isLength({ max: 100 }),
    body('slug').notEmpty().isLength({ max: 100 }),
    body('description').optional(),
    body('thumbnail_url').optional().isURL(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { name, slug, description, thumbnail_url } = req.body;
      
      const result = await query(
        `INSERT INTO categories (name, slug, description, thumbnail_url)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [name, slug, description, thumbnail_url]
      );
      
      logger.info('Category created', { categoryId: result.rows[0].id });
      res.status(201).json(result.rows[0]);
    } catch (error) {
      logger.error('Error creating category:', error);
      res.status(500).json({ error: 'Failed to create category' });
    }
  }
);

router.post(
  '/creators',
  authenticateToken,
  requireRole(['admin']),
  [
    body('name').notEmpty().isLength({ max: 200 }),
    body('slug').notEmpty().isLength({ max: 200 }),
    body('bio').optional(),
    body('thumbnail_url').optional().isURL(),
    body('cover_image_url').optional().isURL(),
    body('category_id').optional().isUUID(),
    body('plan_required').isIn(['free', 'standard', 'premium']),
    body('is_featured').optional().isBoolean(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const {
        name,
        slug,
        bio,
        thumbnail_url,
        cover_image_url,
        category_id,
        plan_required,
        is_featured,
      } = req.body;
      
      const result = await query(
        `INSERT INTO creators 
         (name, slug, bio, thumbnail_url, cover_image_url, category_id, plan_required, is_featured)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [name, slug, bio, thumbnail_url, cover_image_url, category_id, plan_required, is_featured]
      );
      
      logger.info('Creator created', { creatorId: result.rows[0].id });
      res.status(201).json(result.rows[0]);
    } catch (error) {
      logger.error('Error creating creator:', error);
      res.status(500).json({ error: 'Failed to create creator' });
    }
  }
);

export default router;