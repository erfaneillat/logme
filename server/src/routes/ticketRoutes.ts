import { Router } from 'express';
import ticketController from '../controllers/ticketController';
import { authenticateToken, authenticateAdmin } from '../middleware/authMiddleware';

const router = Router();

// Admin routes (admin only) - must come first to avoid conflicts
router.get('/admin/statistics', authenticateAdmin, ticketController.getStatistics);
router.get('/admin/list', authenticateAdmin, ticketController.list);
router.get('/admin/unread-count', authenticateAdmin, ticketController.getUnreadCount);
router.put('/:id/status', authenticateAdmin, ticketController.updateStatus);
router.put('/:id/priority', authenticateAdmin, ticketController.updatePriority);
router.delete('/:id', authenticateAdmin, ticketController.delete);

// User routes (authenticated users)
router.post('/', authenticateToken, ticketController.create);
router.get('/my-tickets', authenticateToken, ticketController.getUserTickets);
router.get('/:id', authenticateToken, ticketController.getById);
router.post('/:id/messages', authenticateToken, ticketController.addMessage);

export default router;
