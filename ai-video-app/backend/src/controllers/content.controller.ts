import { Request, Response, NextFunction } from 'express';
import { ContentService } from '../services/content.service';
import { ApiError } from '../middleware/errorHandler';

export class ContentController {
  private contentService: ContentService;

  constructor() {
    this.contentService = new ContentService();
  }

  generateContent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { characterId, scenarioId } = req.body;
      const userId = req.user!.userId;

      // Check usage limits
      const canGenerate = await this.contentService.checkUsageLimit(userId);
      if (!canGenerate) {
        throw new ApiError(403, '使用回数の上限に達しました');
      }

      // Generate content
      const session = await this.contentService.generateContent({
        userId,
        characterId,
        scenarioId,
      });

      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  };

  getSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user!.userId;

      const session = await this.contentService.getSessionById(sessionId, userId);

      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  };

  getUserSessions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { page = 1, limit = 20 } = req.query;

      const sessions = await this.contentService.getUserSessions(
        userId,
        Number(page),
        Number(limit)
      );

      res.json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      next(error);
    }
  };
}