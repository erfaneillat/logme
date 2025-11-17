import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { WeightController } from '../controllers/weightController';

const router = express.Router();
const controller = new WeightController();

// Upsert weight for a date
router.post('/', authenticateToken, (req, res) => controller.upsertWeight(req, res));

// Get latest weight
router.get('/latest', authenticateToken, (req, res) => controller.getLatest(req, res));

// Get weights in a date range
router.get('/range', authenticateToken, (req, res) => controller.getRange(req, res));

export default router;
