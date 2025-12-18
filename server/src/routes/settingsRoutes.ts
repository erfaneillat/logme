import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { authenticateToken, authenticateAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// Allow any authenticated user (webapp) to read settings to know if they can access kitchen.
router.get('/', authenticateToken, getSettings);

// Admin only to update
router.put('/', authenticateAdmin, updateSettings);

export default router;
