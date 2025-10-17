import { Router } from 'express';
import userController from '../controllers/userController';
import { authenticateAdmin } from '../middleware/authMiddleware';

const router = Router();

// Specific routes must come BEFORE generic :id routes
// GET /api/users/deleted/list - List deleted users
router.get('/deleted/list', authenticateAdmin, (req, res) => userController.listDeleted(req, res));

// GET /api/users/deleted/:id - Get a specific deleted user
router.get('/deleted/:id', authenticateAdmin, (req, res) => userController.getDeletedById(req, res));

// GET /api/users/:userId/referral-logs - MUST come before /:id route
router.get('/:userId/referral-logs', authenticateAdmin, userController.getUserReferralLogs);

// Generic routes
// GET /api/users
router.get('/', authenticateAdmin, userController.list);

// GET /api/users/:id
router.get('/:id', authenticateAdmin, userController.getById);

// PATCH /api/users/:id
router.patch('/:id', authenticateAdmin, userController.update);

// DELETE /api/users/:id
router.delete('/:id', authenticateAdmin, userController.delete);

export default router;
