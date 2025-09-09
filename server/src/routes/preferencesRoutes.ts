import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { PreferencesController } from '../controllers/preferencesController';

const router = express.Router();
const controller = new PreferencesController();

// Get user preferences
router.get('/', authenticateToken, (req, res) => controller.getUserPreferences(req, res));

// Update user preferences
router.patch('/', authenticateToken, (req, res) => controller.updateUserPreferences(req, res));

export default router;