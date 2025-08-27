import express from 'express';
import { ReferralController } from '../controllers/referralController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();
const controller = new ReferralController();

router.get('/my-code', authenticateToken, (req, res) => controller.getMyCode(req as any, res));
router.get('/validate/:code', (req, res) => controller.validateCode(req, res));
router.post('/submit', authenticateToken, (req, res) => controller.submitCode(req as any, res));
router.get('/summary', authenticateToken, (req, res) => controller.getSummary(req as any, res));

export default router;
