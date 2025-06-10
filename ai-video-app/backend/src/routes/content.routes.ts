import { Router } from 'express';
import { ContentController } from '../controllers/content.controller';
import { authenticate, requireAgeVerification } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { generateContentSchema } from '../validations/content.validation';

const router = Router();
const contentController = new ContentController();

// All content routes require authentication and age verification
router.use(authenticate);
router.use(requireAgeVerification);

router.post('/generate', validate(generateContentSchema), contentController.generateContent);
router.get('/session/:sessionId', contentController.getSession);
router.get('/sessions', contentController.getUserSessions);

export default router;