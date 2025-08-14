import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { LogController } from '../controllers/logController';

const router = express.Router();
const controller = new LogController();

// Upsert a daily log entry
router.post('/', authenticateToken, controller.upsertDailyLog);

// Get a daily log by date
router.get('/', authenticateToken, controller.getDailyLog);

// Get logs in a date range [start, end]
router.get('/range', authenticateToken, controller.getLogsRange);

// Toggle like on a specific item inside a daily log
router.patch('/item/like', authenticateToken, controller.toggleItemLike);

export default router;


