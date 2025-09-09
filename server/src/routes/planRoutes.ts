import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { PlanController } from '../controllers/planController';

const router = express.Router();
const controller = new PlanController();

router.post('/generate', authenticateToken, (req, res) => controller.generatePlan(req, res));
router.get('/latest', authenticateToken, (req, res) => controller.getLatestPlan(req, res));
router.patch('/manual', authenticateToken, (req, res) => controller.updatePlanManual(req, res));

export default router;


