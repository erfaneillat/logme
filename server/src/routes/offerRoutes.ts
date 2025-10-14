import express from 'express';
import { OfferController } from '../controllers/offerController';
import { authenticateToken, optionalAuth, authenticateAdmin } from '../middleware/authMiddleware';

const router = express.Router();
const offerController = new OfferController();

// Public routes (with optional authentication for user-specific offers)
router.get('/active', optionalAuth, offerController.getActiveOffersForUser.bind(offerController));
router.get('/:id', offerController.getOfferById.bind(offerController));

// Admin routes
router.get('/', authenticateAdmin, offerController.getAllOffers.bind(offerController));
router.post('/', authenticateAdmin, offerController.createOffer.bind(offerController));
router.put('/:id', authenticateAdmin, offerController.updateOffer.bind(offerController));
router.delete('/:id', authenticateAdmin, offerController.deleteOffer.bind(offerController));
router.patch('/:id/toggle', authenticateAdmin, offerController.toggleOfferStatus.bind(offerController));
router.post('/:id/increment-usage', authenticateAdmin, offerController.incrementUsageCount.bind(offerController));

export default router;
