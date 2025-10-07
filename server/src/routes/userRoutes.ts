import { Router } from 'express';
import userController from '../controllers/userController';
import { authenticateAdmin } from '../middleware/authMiddleware';

const router = Router();

// GET /api/users
router.get('/', authenticateAdmin, userController.list);

// GET /api/users/:id
router.get('/:id', authenticateAdmin, userController.getById);

// PATCH /api/users/:id
router.patch('/:id', authenticateAdmin, userController.update);

// DELETE /api/users/:id
router.delete('/:id', authenticateAdmin, userController.delete);

export default router;
