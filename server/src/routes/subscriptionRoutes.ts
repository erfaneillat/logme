import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscriptionController';
import { authenticateToken as authenticate } from '../middleware/authMiddleware';

const router = Router();
const subscriptionController = new SubscriptionController();

// All routes require authentication
router.post('/verify-purchase', authenticate, (req, res) =>
    subscriptionController.verifyPurchase(req, res)
);

router.get('/status', authenticate, (req, res) =>
    subscriptionController.getSubscriptionStatus(req, res)
);

router.post('/cancel', authenticate, (req, res) =>
    subscriptionController.cancelSubscription(req, res)
);

router.get('/history', authenticate, (req, res) =>
    subscriptionController.getSubscriptionHistory(req, res)
);

// Validate purchase with Cafe Bazaar API
router.post('/validate-cafebazaar', authenticate, (req, res) =>
    subscriptionController.validateCafeBazaarPurchase(req, res)
);

// Check subscription status with Cafe Bazaar API
router.post('/check-subscription-status', authenticate, (req, res) =>
    subscriptionController.checkCafeBazaarSubscriptionStatus(req, res)
);

export default router;

