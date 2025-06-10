import { Request, Response, NextFunction } from 'express';
import { CharacterService } from '../services/character.service';

export class CharacterController {
  private characterService: CharacterService;

  constructor() {
    this.characterService = new CharacterService();
  }

  getCharacters = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userPlanType = req.user!.planType;
      const characters = await this.characterService.getAvailableCharacters(userPlanType);

      res.json({
        success: true,
        data: characters,
      });
    } catch (error) {
      next(error);
    }
  };

  getCharacterById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { characterId } = req.params;
      const userPlanType = req.user!.planType;

      const character = await this.characterService.getCharacterById(characterId, userPlanType);

      res.json({
        success: true,
        data: character,
      });
    } catch (error) {
      next(error);
    }
  };

  getCharacterScenarios = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { characterId } = req.params;
      const userPlanType = req.user!.planType;

      const scenarios = await this.characterService.getCharacterScenarios(characterId, userPlanType);

      res.json({
        success: true,
        data: scenarios,
      });
    } catch (error) {
      next(error);
    }
  };
}