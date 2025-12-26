import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
    getAllCategories,
    getKitchenStatus,
    getAdminCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    uploadKitchenImage,
    importKitchenItems,
    saveKitchenItem,
    unsaveKitchenItem,
    getSavedKitchenItems,
    checkSavedStatus,
    generateImageForItem,
    compressImagesForCategory,
    recordKitchenItemClick,
    getKitchenAnalytics,
    getItemClickHistory,
    updateCategoryWithJson,
    getCategoryLanguageStats
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
router.get('/status', authenticateToken, getKitchenStatus);
router.get('/categories', authenticateToken, getAllCategories);

// Upload route
router.post('/upload', authenticateAdmin, upload.single('image'), uploadKitchenImage);

// Import route
router.post('/import', authenticateAdmin, importKitchenItems);

// Serve images
router.get('/images/:filename', (req, res) => {
    const filename = req.params.filename;

    // Check in main uploads directory first
    let filepath = path.join(uploadsDir, filename);

    // If not found, check in kitchen subdirectory
    if (!fs.existsSync(filepath)) {
        filepath = path.join(uploadsDir, 'kitchen', filename);
    }

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

// AI Image Generation route (single item at a time to avoid timeout)
router.post('/generate-image', authenticateAdmin, generateImageForItem);

// Image compression route
router.post('/compress-images', authenticateAdmin, compressImagesForCategory);

// Update from JSON route
router.post('/update-json', authenticateAdmin, updateCategoryWithJson);

// Language stats route
router.get('/categories/:categoryId/language-stats', authenticateAdmin, getCategoryLanguageStats);

// User saved items routes
router.get('/saved', authenticateToken, getSavedKitchenItems);
router.post('/saved', authenticateToken, saveKitchenItem);
router.post('/saved/check', authenticateToken, checkSavedStatus);
router.delete('/saved/:kitchenItemId', authenticateToken, unsaveKitchenItem);

// Analytics routes
router.post('/analytics/click', authenticateToken, recordKitchenItemClick);
router.get('/admin/analytics', authenticateAdmin, getKitchenAnalytics);
router.get('/admin/analytics/item/:itemId', authenticateAdmin, getItemClickHistory);

export default router;
