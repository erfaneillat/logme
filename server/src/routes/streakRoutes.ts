import { Router } from 'express';
import StreakController from '../controllers/streakController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// GET /api/streak/completions?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/completions', authenticateToken, (req, res) =>
  StreakController.getCompletionsRange(req as any, res)
);

export default router;
