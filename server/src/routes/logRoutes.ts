import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { LogController } from '../controllers/logController';

const router = express.Router();
const controller = new LogController();

// Upsert a daily log entry
router.post('/', authenticateToken, (req, res) => controller.upsertDailyLog(req, res));

// Get a daily log by date
router.get('/', authenticateToken, (req, res) => controller.getDailyLog(req, res));

// Get logs in a date range [start, end]
router.get('/range', authenticateToken, (req, res) => controller.getLogsRange(req, res));

// Toggle like on a specific item inside a daily log
router.patch('/item/like', authenticateToken, (req, res) => controller.toggleItemLike(req, res));

// Remove an item from favorites (set liked=false)
router.delete('/item/:itemId/favorite', authenticateToken, (req, res) => controller.removeItemFromFavorites(req, res));

// Add a manual item to a daily log
router.post('/item', authenticateToken, (req, res) => controller.addItem(req, res));

// Update a specific item (macros, title, ingredients, liked, image, healthScore)
router.patch('/item/:itemId', authenticateToken, (req, res) => controller.updateItem(req, res));

// Delete an item from a specific day's log and update totals
router.delete('/item/:itemId', authenticateToken, (req, res) => controller.deleteItem(req, res));

// Update burned calories for a specific date
router.patch('/burned-calories', authenticateToken, (req, res) => controller.updateBurnedCalories(req, res));

// Analyze exercise and get AI-calculated calories
router.post('/analyze-exercise', authenticateToken, (req, res) => controller.analyzeExercise(req, res));

export default router;


