import { Request, Response, NextFunction } from 'express';
import { ScenarioService } from '../services/scenario.service';

export class ScenarioController {
  private scenarioService: ScenarioService;

  constructor() {
    this.scenarioService = new ScenarioService();
  }

  getScenarioById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { scenarioId } = req.params;
      const userPlanType = req.user!.planType;

      const scenario = await this.scenarioService.getScenarioById(scenarioId, userPlanType);

      res.json({
        success: true,
        data: scenario,
      });
    } catch (error) {
      next(error);
    }
  };
}