import { Router } from 'express';
import { body, param } from 'express-validator';
import { SubscriptionPlanController } from '../controllers/subscriptionPlanController';
import { authenticateAdmin } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const controller = new SubscriptionPlanController();

// Create uploads directory for plan images if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads/plans');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for plan image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname || '');
        cb(null, `plan-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            const ext = path.extname(file.originalname || '').toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed'));
            }
        }
    }
});

// Validation rules for creating a plan
const createPlanValidation = [
    body('name').notEmpty().withMessage('Plan name is required'),
    body('title').optional().isString(),
    body('duration').isIn(['monthly', '3month', 'yearly']).withMessage('Duration must be monthly, 3month, or yearly'),
    body('price').isNumeric().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('originalPrice').optional().isNumeric().isFloat({ min: 0 }).withMessage('Original price must be a positive number'),
    body('discountPercentage').optional().isNumeric().isFloat({ min: 0, max: 100 }).withMessage('Discount percentage must be between 0 and 100'),
    body('pricePerMonth').optional().isNumeric().isFloat({ min: 0 }).withMessage('Price per month must be a positive number'),
    body('cafebazaarProductKey').optional().isString(),
    body('imageUrl').optional().isString(),
    body('isActive').optional().isBoolean(),
    body('features').optional().isArray(),
    body('sortOrder').optional().isNumeric(),
];

// Validation rules for updating a plan
const updatePlanValidation = [
    param('id').isMongoId().withMessage('Invalid plan ID'),
    body('name').optional().notEmpty().withMessage('Plan name cannot be empty'),
    body('title').optional().isString(),
    body('duration').optional().isIn(['monthly', '3month', 'yearly']).withMessage('Duration must be monthly, 3month, or yearly'),
    body('price').optional().isNumeric().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('originalPrice').optional({ nullable: true }).custom((value) => value === null || (typeof value === 'number' && value >= 0)).withMessage('Original price must be a positive number or null'),
    body('discountPercentage').optional({ nullable: true }).custom((value) => value === null || (typeof value === 'number' && value >= 0 && value <= 100)).withMessage('Discount percentage must be between 0 and 100 or null'),
    body('pricePerMonth').optional({ nullable: true }).custom((value) => value === null || (typeof value === 'number' && value >= 0)).withMessage('Price per month must be a positive number or null'),
    body('cafebazaarProductKey').optional().isString(),
    body('imageUrl').optional().isString(),
    body('isActive').optional().isBoolean(),
    body('features').optional().isArray(),
    body('sortOrder').optional().isNumeric(),
];

// Validation rules for updating price
const updatePriceValidation = [
    param('duration').isIn(['monthly', '3month', 'yearly']).withMessage('Duration must be monthly, 3month, or yearly'),
    body('title').optional().isString(),
    body('price').optional().isNumeric().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('originalPrice').optional().isNumeric().isFloat({ min: 0 }).withMessage('Original price must be a positive number'),
    body('discountPercentage').optional().isNumeric().isFloat({ min: 0, max: 100 }).withMessage('Discount percentage must be between 0 and 100'),
    body('pricePerMonth').optional().isNumeric().isFloat({ min: 0 }).withMessage('Price per month must be a positive number'),
];

// Public routes (for mobile app to fetch plans)
router.get('/', controller.getAllPlans.bind(controller));
router.get('/:id', controller.getPlanById.bind(controller));

// Admin-only routes
router.post('/', authenticateAdmin, createPlanValidation, controller.createPlan.bind(controller));
router.put('/:id', authenticateAdmin, updatePlanValidation, controller.updatePlan.bind(controller));
router.delete('/:id', authenticateAdmin, controller.deletePlan.bind(controller));
router.patch('/:id/toggle-status', authenticateAdmin, controller.togglePlanStatus.bind(controller));

// Admin-only route - update price for monthly or yearly plan (backward compatibility)
router.put('/:duration/price', authenticateAdmin, updatePriceValidation, controller.updatePlanPrice.bind(controller));

// Image management routes
router.post('/:id/image', authenticateAdmin, upload.single('image'), controller.uploadPlanImage.bind(controller));
router.delete('/:id/image', authenticateAdmin, controller.deletePlanImage.bind(controller));

// Serve plan images
router.get('/images/:filename', (req, res): void => {
    const filename = req.params.filename;
    const filepath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filepath)) {
        res.status(404).json({ error: 'Image not found' });
        return;
    }

    res.sendFile(filepath);
});

export default router;

