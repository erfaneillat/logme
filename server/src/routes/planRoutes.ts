import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { PlanController } from '../controllers/planController';

const router = express.Router();
const controller = new PlanController();

router.post('/generate', authenticateToken, controller.generatePlan);
router.get('/latest', authenticateToken, controller.getLatestPlan);
router.patch('/manual', authenticateToken, controller.updatePlanManual);

export default router;


