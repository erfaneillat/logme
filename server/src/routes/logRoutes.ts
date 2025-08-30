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

// Remove an item from favorites (set liked=false)
router.delete('/item/:itemId/favorite', authenticateToken, controller.removeItemFromFavorites);

// Add a manual item to a daily log
router.post('/item', authenticateToken, controller.addItem);

// Update a specific item (macros, title, ingredients, liked, image, healthScore)
router.patch('/item/:itemId', authenticateToken, controller.updateItem);

// Delete an item from a specific day's log and update totals
router.delete('/item/:itemId', authenticateToken, controller.deleteItem);

// Update burned calories for a specific date
router.patch('/burned-calories', authenticateToken, controller.updateBurnedCalories);

export default router;


