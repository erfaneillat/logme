import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { WeightController } from '../controllers/weightController';

const router = express.Router();
const controller = new WeightController();

// Upsert weight for a date
router.post('/', authenticateToken, controller.upsertWeight);

// Get latest weight
router.get('/latest', authenticateToken, controller.getLatest);

// Get weights in a date range
router.get('/range', authenticateToken, controller.getRange);

export default router;
