import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// All user routes require authentication
router.use(authenticate);

router.get('/profile', (req, res) => {
  res.json({ message: 'User profile endpoint' });
});

router.put('/profile', (req, res) => {
  res.json({ message: 'Update profile endpoint' });
});

router.get('/usage', (req, res) => {
  res.json({ message: 'User usage stats endpoint' });
});

router.delete('/account', (req, res) => {
  res.json({ message: 'Delete account endpoint' });
});

export default router;