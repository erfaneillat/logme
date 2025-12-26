import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscriptionController';
import { authenticateToken as authenticate, authenticateAdmin } from '../middleware/authMiddleware';

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

// Verify with RevenueCat
router.post('/verify-revenuecat', authenticate, (req, res) =>
    subscriptionController.verifyRevenueCat(req, res)
);

// Check subscription status with Cafe Bazaar API
router.post('/check-subscription-status', authenticate, (req, res) =>
    subscriptionController.checkCafeBazaarSubscriptionStatus(req, res)
);

// Admin routes
router.get('/admin/all', authenticateAdmin, (req, res) =>
    subscriptionController.listAllSubscriptions(req, res)
);

router.post('/admin/:subscriptionId/cancel', authenticateAdmin, (req, res) =>
    subscriptionController.cancelUserSubscription(req, res)
);

router.post('/admin/:subscriptionId/extend', authenticateAdmin, (req, res) =>
    subscriptionController.extendSubscription(req, res)
);

router.post('/admin/activate', authenticateAdmin, (req, res) =>
    subscriptionController.activateSubscriptionForUser(req, res)
);

// RevenueCat Webhook - No user auth, uses webhook secret instead
router.post('/webhook/revenuecat', (req, res) =>
    subscriptionController.handleRevenueCatWebhook(req, res)
);

export default router;


