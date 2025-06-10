import { Router } from 'express';
import { CharacterController } from '../controllers/character.controller';
import { authenticate, requireAgeVerification } from '../middleware/auth';

const router = Router();
const characterController = new CharacterController();

// All character routes require authentication and age verification
router.use(authenticate);
router.use(requireAgeVerification);

router.get('/', characterController.getCharacters);
router.get('/:characterId', characterController.getCharacterById);
router.get('/:characterId/scenarios', characterController.getCharacterScenarios);

export default router;