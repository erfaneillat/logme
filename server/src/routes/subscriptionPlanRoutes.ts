import { Router } from 'express';
import { body, param } from 'express-validator';
import { SubscriptionPlanController } from '../controllers/subscriptionPlanController';
import { authenticateAdmin } from '../middleware/authMiddleware';

const router = Router();
const controller = new SubscriptionPlanController();

// Validation rules for updating price
const updatePriceValidation = [
    param('duration').isIn(['monthly', 'yearly']).withMessage('Duration must be monthly or yearly'),
    body('price').optional().isNumeric().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('originalPrice').optional().isNumeric().isFloat({ min: 0 }).withMessage('Original price must be a positive number'),
    body('discountPercentage').optional().isNumeric().isFloat({ min: 0, max: 100 }).withMessage('Discount percentage must be between 0 and 100'),
    body('pricePerMonth').optional().isNumeric().isFloat({ min: 0 }).withMessage('Price per month must be a positive number'),
];

// Public routes (for mobile app to fetch plans)
router.get('/', controller.getAllPlans.bind(controller));
router.get('/:id', controller.getPlanById.bind(controller));

// Admin-only route - update price for monthly or yearly plan
router.put('/:duration/price', authenticateAdmin, updatePriceValidation, controller.updatePlanPrice.bind(controller));

export default router;

