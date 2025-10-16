import express from 'express';
import {
  checkAppVersion,
  getAllAppVersions,
  getAppVersionById,
  createAppVersion,
  updateAppVersion,
  deleteAppVersion,
  toggleAppVersionActive,
} from '../controllers/appVersionController';
import { authenticateAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// Public route - check for updates
router.get('/check', checkAppVersion);

// Admin routes - require authentication and admin privileges
router.use(authenticateAdmin);

router.get('/', getAllAppVersions);
router.get('/:id', getAppVersionById);
router.post('/', createAppVersion);
router.put('/:id', updateAppVersion);
router.delete('/:id', deleteAppVersion);
router.patch('/:id/toggle-active', toggleAppVersionActive);

export default router;
