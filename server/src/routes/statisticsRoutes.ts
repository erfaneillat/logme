import express from 'express';
import { 
    getDashboardStatistics, 
    getUserGrowth, 
    getRevenueStatistics 
} from '../controllers/statisticsController';
import { authenticateAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// All statistics routes require admin authentication
router.use(authenticateAdmin);

/**
 * GET /api/statistics/dashboard
 * Get comprehensive dashboard statistics
 */
router.get('/dashboard', getDashboardStatistics);

/**
 * GET /api/statistics/user-growth
 * Get user growth over time
 * Query params: days (default: 30)
 */
router.get('/user-growth', getUserGrowth);

/**
 * GET /api/statistics/revenue
 * Get revenue statistics
 */
router.get('/revenue', getRevenueStatistics);

export default router;
