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

// Routes
router.post('/send-code', phoneValidation, authController.sendVerificationCode);
router.post('/verify-phone', verificationCodeValidation, authController.verifyPhone);
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, profileUpdateValidation, authController.updateProfile);
router.post('/refresh-token', authenticateTokenAllowExpired, authController.refreshToken);
router.delete('/account', authenticateToken, deleteAccountValidation, authController.deleteAccount);

export default router;
