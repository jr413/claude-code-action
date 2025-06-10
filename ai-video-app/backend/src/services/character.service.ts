import { query } from '../config/database';
import { ApiError } from '../middleware/errorHandler';

export class CharacterService {
  async getAvailableCharacters(userPlanType: string) {
    // Plan hierarchy: premium > standard > free
    const planHierarchy: Record<string, number> = {
      free: 0,
      standard: 1,
      premium: 2,
    };

    const userPlanLevel = planHierarchy[userPlanType] || 0;

    const result = await query(
      `SELECT id, name, display_name, thumbnail_url, avatar_url, plan_required, description, personality
       FROM characters
       WHERE is_active = true 
       AND (
         plan_required = 'free' OR
         (plan_required = 'standard' AND $1 >= 1) OR
         (plan_required = 'premium' AND $1 >= 2)
       )
       ORDER BY sort_order, created_at`,
      [userPlanLevel]
    );

    return result.rows.map(char => ({
      ...char,
      isLocked: planHierarchy[char.plan_required] > userPlanLevel,
    }));
  }

  async getCharacterById(characterId: string, userPlanType: string) {
    const result = await query(
      'SELECT * FROM characters WHERE id = $1 AND is_active = true',
      [characterId]
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, 'キャラクターが見つかりません');
    }

    const character = result.rows[0];

    // Check if user has access to this character
    const planHierarchy: Record<string, number> = {
      free: 0,
      standard: 1,
      premium: 2,
    };

    if (planHierarchy[character.plan_required] > planHierarchy[userPlanType]) {
      throw new ApiError(403, 'このキャラクターにアクセスするには上位プランが必要です');
    }

    return character;
  }

  async getCharacterScenarios(characterId: string, userPlanType: string) {
    // First verify the character exists and user has access
    await this.getCharacterById(characterId, userPlanType);

    const result = await query(
      `SELECT id, title, description, duration, intensity_level, tags
       FROM scenarios
       WHERE character_id = $1 AND is_active = true
       ORDER BY sort_order, created_at`,
      [characterId]
    );

    return result.rows;
  }
}