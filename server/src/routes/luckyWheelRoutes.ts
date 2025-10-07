import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { LuckyWheelController } from '../controllers/luckyWheelController';

const router = express.Router();
const controller = new LuckyWheelController();

// Log when a user views the lucky wheel
router.post('/view', authenticateToken, (req, res) => controller.logLuckyWheelView(req, res));

// Get lucky wheel view history for a user
router.get('/history', authenticateToken, (req, res) => controller.getLuckyWheelHistory(req, res));

// Get lucky wheel statistics for a user
router.get('/stats', authenticateToken, (req, res) => controller.getLuckyWheelStats(req, res));

export default router;
