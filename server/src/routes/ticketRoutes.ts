import express from 'express';
import ticketController from '../controllers/ticketController';
import { authenticateToken, authenticateAdmin } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Setup Multer
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
        cb(null, `ticket-${uniqueSuffix}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
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


// Admin routes (admin only) - must come first to avoid conflicts
router.get('/admin/statistics', authenticateAdmin, ticketController.getStatistics);
router.get('/admin/list', authenticateAdmin, ticketController.list);
router.get('/admin/unread-count', authenticateAdmin, ticketController.getUnreadCount);
router.put('/:id/status', authenticateAdmin, ticketController.updateStatus);
router.put('/:id/priority', authenticateAdmin, ticketController.updatePriority);
router.delete('/:id', authenticateAdmin, ticketController.delete);

// User routes (authenticated users)
router.post('/upload', authenticateToken, upload.single('image'), ticketController.uploadImage);
router.post('/', authenticateToken, ticketController.create);
router.get('/my-tickets', authenticateToken, ticketController.getUserTickets);
router.get('/:id', authenticateToken, ticketController.getById);
router.post('/:id/messages', authenticateToken, ticketController.addMessage);

export default router;
