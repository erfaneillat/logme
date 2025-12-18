import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
    getAllCategories,
    getAdminCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    uploadKitchenImage,
    importKitchenItems
} from '../controllers/kitchenController';
import { authenticateToken, authenticateAdmin } from '../middleware/authMiddleware';

// Configure multer
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname || '');
        cb(null, `kitchen-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

const router = express.Router();

// Public/User routes
router.get('/categories', authenticateToken, getAllCategories);

// Upload route
router.post('/upload', authenticateAdmin, upload.single('image'), uploadKitchenImage);

// Import route
router.post('/import', authenticateAdmin, importKitchenItems);

// Serve images
router.get('/images/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filepath)) {
        res.status(404).json({ error: 'Image not found' });
        return;
    }

    res.sendFile(filepath);
});

// Admin routes
router.get('/admin/categories', authenticateAdmin, getAdminCategories);
router.get('/categories/:id', authenticateAdmin, getCategoryById);
router.post('/categories', authenticateAdmin, createCategory);
router.put('/categories/:id', authenticateAdmin, updateCategory);
router.delete('/categories/:id', authenticateAdmin, deleteCategory);

export default router;
