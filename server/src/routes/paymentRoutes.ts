import { Router } from 'express';
import { paymentController } from '../controllers/paymentController';
import { authenticateToken as authenticate } from '../middleware/authMiddleware';

const router = Router();

// Create a new Zarinpal payment
router.post('/zarinpal/create', authenticate, (req, res) =>
    paymentController.createZarinpalPayment(req, res)
);

// Zarinpal callback (no auth - called by Zarinpal redirect)
router.get('/zarinpal/callback', (req, res) =>
    paymentController.zarinpalCallback(req, res)
);

// Verify payment status
router.post('/zarinpal/verify', authenticate, (req, res) =>
    paymentController.verifyZarinpalPayment(req, res)
);

// Get pending payments
router.get('/pending', authenticate, (req, res) =>
    paymentController.getPendingPayments(req, res)
);

// Get payment history
router.get('/history', authenticate, (req, res) =>
    paymentController.getPaymentHistory(req, res)
);

export default router;
