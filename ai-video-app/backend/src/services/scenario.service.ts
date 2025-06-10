import { query } from '../config/database';
import { ApiError } from '../middleware/errorHandler';

export class ScenarioService {
  async getScenarioById(scenarioId: string, userPlanType: string) {
    const result = await query(
      `SELECT s.*, c.plan_required
       FROM scenarios s
       JOIN characters c ON s.character_id = c.id
       WHERE s.id = $1 AND s.is_active = true AND c.is_active = true`,
      [scenarioId]
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, 'シナリオが見つかりません');
    }

    const scenario = result.rows[0];

    // Check if user has access to this scenario's character
    const planHierarchy: Record<string, number> = {
      free: 0,
      standard: 1,
      premium: 2,
    };

    if (planHierarchy[scenario.plan_required] > planHierarchy[userPlanType]) {
      throw new ApiError(403, 'このシナリオにアクセスするには上位プランが必要です');
    }

    return scenario;
  }
}