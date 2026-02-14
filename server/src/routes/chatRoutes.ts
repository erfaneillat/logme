import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken, authenticateAdmin } from '../middleware/authMiddleware';
import { NutritionChatController } from '../controllers/nutritionChatController';

const router = express.Router();
const controller = new NutritionChatController();

// Reuse uploads directory for chat images
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname || '');
        cb(null, `chat-${uniqueSuffix}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            const ext = path.extname(file.originalname || '').toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.heic', '.heif'].includes(ext)) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed'));
            }
        }
    },
});

router.get('/admin/nutrition/user/:userId/history', authenticateToken, authenticateAdmin, (req, res) =>
    controller.adminUserHistory(req, res)
);
router.delete('/admin/nutrition/user/:userId/reset', authenticateToken, authenticateAdmin, (req, res) =>
    controller.resetUserChat(req, res)
);
router.post('/nutrition', authenticateToken, (req, res) => controller.chat(req, res));
router.get('/nutrition/history', authenticateToken, (req, res) => controller.history(req, res));
router.post('/nutrition/image', authenticateToken, upload.single('image'), (req, res) =>
    controller.uploadImage(req, res)
);

export default router;
