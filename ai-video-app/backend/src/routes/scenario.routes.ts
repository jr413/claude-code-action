import { Router } from 'express';
import { ScenarioController } from '../controllers/scenario.controller';
import { authenticate, requireAgeVerification } from '../middleware/auth';

const router = Router();
const scenarioController = new ScenarioController();

// All scenario routes require authentication and age verification
router.use(authenticate);
router.use(requireAgeVerification);

router.get('/:scenarioId', scenarioController.getScenarioById);

export default router;