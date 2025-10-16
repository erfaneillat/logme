import { Router } from 'express';
import errorLogController from '../controllers/errorLogController';
import { authenticateToken, authenticateAdmin } from '../middleware/authMiddleware';

const router = Router();

// All routes require admin authentication
router.use(authenticateToken);
router.use(authenticateAdmin);

// Get error logs
router.get('/', errorLogController.getLogs.bind(errorLogController));

// Get error log statistics
router.get('/stats', errorLogController.getStats.bind(errorLogController));

// Create manual log entry
router.post('/', errorLogController.createLog.bind(errorLogController));

export default router;
