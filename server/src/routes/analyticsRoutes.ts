import express from 'express';
import { 
    getUserAnalytics, 
    getSubscriptionAnalytics,
    getActivityAnalytics,
    getEngagementAnalytics,
    getCostAnalytics
} from '../controllers/analyticsController';
import { authenticateAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// All analytics routes require admin authentication
router.use(authenticateAdmin);

/**
 * GET /api/analytics/users
 * Get user analytics (registrations, active users, verified users)
 * Query params: period (daily, weekly, monthly, yearly)
 */
router.get('/users', getUserAnalytics);

/**
 * GET /api/analytics/subscriptions
 * Get subscription analytics (new, active, revenue)
 * Query params: period (daily, weekly, monthly, yearly)
 */
router.get('/subscriptions', getSubscriptionAnalytics);

/**
 * GET /api/analytics/activity
 * Get activity analytics (food logs, analyses, training sessions)
 * Query params: period (daily, weekly, monthly, yearly)
 */
router.get('/activity', getActivityAnalytics);

/**
 * GET /api/analytics/engagement
 * Get engagement analytics (completed info, generated plans, avg logs)
 * Query params: period (daily, weekly, monthly, yearly)
 */
router.get('/engagement', getEngagementAnalytics);

/**
 * GET /api/analytics/costs
 * Get AI cost analytics (total cost, avg cost, top users, cost over time)
 * Query params: period (daily, weekly, monthly, yearly)
 */
router.get('/costs', getCostAnalytics);

export default router;
