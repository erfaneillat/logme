import express from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/authController';
import { authenticateToken, authenticateTokenAllowExpired } from '../middleware/authMiddleware';

const router = express.Router();
const authController = new AuthController();

// Validation rules
const phoneValidation = [
  body('phone').isMobilePhone('any').withMessage('Please provide a valid phone number')
];

const verificationCodeValidation = [
  body('phone').isMobilePhone('any').withMessage('Please provide a valid phone number'),
  body('verificationCode').isLength({ min: 6, max: 6 }).withMessage('Verification code must be 6 digits')
];

const profileUpdateValidation = [
  body('name').optional().trim().isLength({ min: 2 }),
  body('email').optional().isEmail().normalizeEmail()
];

const deleteAccountValidation = [
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason must be less than 500 characters')
];

const oauthValidation = [
  body('provider').isIn(['google', 'apple']).withMessage('Provider must be google or apple'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('providerId').notEmpty().withMessage('Provider ID is required'),
  body('name').optional().trim()
];

// Routes
router.post('/send-code', phoneValidation, authController.sendVerificationCode);
router.post('/verify-phone', verificationCodeValidation, authController.verifyPhone);
router.post('/admin/verify-phone', verificationCodeValidation, authController.verifyAdminPhone);
router.post('/oauth', oauthValidation, authController.oauthLogin);
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, profileUpdateValidation, authController.updateProfile);
router.post('/refresh-token', authenticateTokenAllowExpired, authController.refreshToken);
router.post('/track-open', authenticateToken, authController.trackAppOpen);
// Activate One-Time Offer
router.post('/activate-offer', authenticateToken, authController.activateOneTimeOffer);

router.delete('/account', authenticateToken, deleteAccountValidation, authController.deleteAccount);

export default router;
