import express from 'express';
import { AdminLogsController } from '../controllers/adminLogsController';
import { authenticateAdmin } from '../middleware/authMiddleware';

const router = express.Router();
const controller = new AdminLogsController();

// All routes require admin authentication
router.use(authenticateAdmin);

// Get all logs with pagination and filtering
router.get('/', controller.getAllLogs.bind(controller));

// Get log statistics
router.get('/stats', controller.getLogStats.bind(controller));

// Search logs
router.get('/search', controller.searchLogs.bind(controller));

// Get logs by user ID
router.get('/user/:userId', controller.getUserLogs.bind(controller));

export default router;
