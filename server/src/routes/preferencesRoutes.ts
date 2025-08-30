import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { PreferencesController } from '../controllers/preferencesController';

const router = express.Router();
const controller = new PreferencesController();

// Get user preferences
router.get('/', authenticateToken, controller.getUserPreferences);

// Update user preferences
router.patch('/', authenticateToken, controller.updateUserPreferences);

export default router;