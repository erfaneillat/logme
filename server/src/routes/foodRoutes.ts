import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../middleware/authMiddleware';
import { FoodController } from '../controllers/foodController';

const router = express.Router();
const controller = new FoodController();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer to save files to disk
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname || '');
        cb(null, `food-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
    fileFilter: (req, file, cb) => {
        // Check if it's an image by mimetype OR by file extension
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            // Check file extension as fallback (Flutter sometimes sends application/octet-stream)
            const ext = path.extname(file.originalname || '').toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.heic', '.heif'].includes(ext)) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed'));
            }
        }
    }
});

// POST /api/food/analyze  multipart/form-data  field: image
router.post('/analyze', authenticateToken, upload.single('image'), controller.analyzeImage);

// POST /api/food/analyze-description  application/json
router.post('/analyze-description', authenticateToken, controller.analyzeDescription);

// POST /api/food/fix-result  application/json
router.post('/fix-result', authenticateToken, controller.fixResult);

// POST /api/food/add  application/json
router.post('/add', authenticateToken, controller.addFoodItem);

// GET /api/food/images/:filename - serve uploaded images
router.get('/images/:filename', (req, res): void => {
    const filename = req.params.filename;
    const filepath = path.join(uploadsDir, filename);

    // Check if file exists
    if (!fs.existsSync(filepath)) {
        res.status(404).json({ error: 'Image not found' });
        return;
    }

    // Serve the image
    res.sendFile(filepath);
});

export default router;


