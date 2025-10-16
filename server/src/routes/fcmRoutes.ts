import { Router } from 'express';
import fcmController from '../controllers/fcmController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// FCM token management routes (user authenticated)
router.post('/register', authenticateToken, fcmController.registerToken);
router.post('/remove', authenticateToken, fcmController.removeToken);
router.get('/tokens', authenticateToken, fcmController.getTokens);

export default router;
