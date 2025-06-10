import { query, transaction } from '../config/database';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

interface GenerateContentParams {
  userId: string;
  characterId: string;
  scenarioId: string;
}

export class ContentService {
  async checkUsageLimit(userId: string): Promise<boolean> {
    const result = await query(
      'SELECT usage_count, usage_limit FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, 'ユーザーが見つかりません');
    }

    const { usage_count, usage_limit } = result.rows[0];
    return usage_count < usage_limit;
  }

  async generateContent(params: GenerateContentParams) {
    const { userId, characterId, scenarioId } = params;

    return await transaction(async (client) => {
      // Verify character and scenario access
      const scenarioResult = await client.query(
        `SELECT s.*, c.plan_required, c.name as character_name
         FROM scenarios s
         JOIN characters c ON s.character_id = c.id
         WHERE s.id = $1 AND s.character_id = $2 
         AND s.is_active = true AND c.is_active = true`,
        [scenarioId, characterId]
      );

      if (scenarioResult.rows.length === 0) {
        throw new ApiError(404, 'シナリオが見つかりません');
      }

      const scenario = scenarioResult.rows[0];

      // Get user plan
      const userResult = await client.query(
        'SELECT plan_type FROM users WHERE id = $1',
        [userId]
      );

      const userPlanType = userResult.rows[0].plan_type;

      // Determine AI provider based on plan
      const aiProvider = userPlanType === 'premium' ? 'veo3' : 'runway_gen3';
      const generationCost = userPlanType === 'premium' ? 245 : 95;

      // Create session
      const sessionResult = await client.query(
        `INSERT INTO user_sessions 
         (user_id, character_id, scenario_id, ai_provider, generation_cost)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, characterId, scenarioId, aiProvider, generationCost]
      );

      const session = sessionResult.rows[0];

      // Update user usage count
      await client.query(
        'UPDATE users SET usage_count = usage_count + 1 WHERE id = $1',
        [userId]
      );

      // Simulate AI video generation (mock)
      this.simulateVideoGeneration(session.id, scenario);

      return {
        sessionId: session.id,
        status: 'processing',
        estimatedTime: 30, // seconds
        character: {
          id: characterId,
          name: scenario.character_name,
        },
        scenario: {
          id: scenarioId,
          title: scenario.title,
          duration: scenario.duration,
        },
      };
    });
  }

  async simulateVideoGeneration(sessionId: string, scenario: any) {
    // In a real app, this would call the AI API
    // For MVP, we'll simulate with a delay and mock URLs
    setTimeout(async () => {
      try {
        const mockVideoUrl = `https://example.com/videos/${sessionId}.mp4`;
        const mockAudioUrl = `https://example.com/audio/${sessionId}.mp3`;

        await query(
          `UPDATE user_sessions 
           SET video_url = $1, audio_url = $2, 
               video_generation_status = 'completed',
               completed_at = NOW()
           WHERE id = $3`,
          [mockVideoUrl, mockAudioUrl, sessionId]
        );

        logger.info(`Video generation completed for session ${sessionId}`);
      } catch (error) {
        logger.error(`Video generation failed for session ${sessionId}`, error);
        
        await query(
          `UPDATE user_sessions 
           SET video_generation_status = 'failed',
               error_message = $1
           WHERE id = $2`,
          ['Mock generation failed', sessionId]
        );
      }
    }, 30000); // 30 seconds
  }

  async getSessionById(sessionId: string, userId: string) {
    const result = await query(
      `SELECT us.*, c.name as character_name, c.display_name as character_display_name,
              s.title as scenario_title, s.description as scenario_description,
              s.duration as scenario_duration
       FROM user_sessions us
       JOIN characters c ON us.character_id = c.id
       JOIN scenarios s ON us.scenario_id = s.id
       WHERE us.id = $1 AND us.user_id = $2`,
      [sessionId, userId]
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, 'セッションが見つかりません');
    }

    return result.rows[0];
  }

  async getUserSessions(userId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;

    const countResult = await query(
      'SELECT COUNT(*) FROM user_sessions WHERE user_id = $1',
      [userId]
    );

    const totalCount = parseInt(countResult.rows[0].count);

    const sessionsResult = await query(
      `SELECT us.*, c.name as character_name, c.display_name as character_display_name,
              s.title as scenario_title
       FROM user_sessions us
       JOIN characters c ON us.character_id = c.id
       JOIN scenarios s ON us.scenario_id = s.id
       WHERE us.user_id = $1
       ORDER BY us.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return {
      sessions: sessionsResult.rows,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }
}