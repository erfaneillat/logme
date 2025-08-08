import express from 'express';
import { body } from 'express-validator';
import { AdditionalInfoController } from '../controllers/additionalInfoController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();
const additionalInfoController = new AdditionalInfoController();

// Validation rules
const saveAdditionalInfoValidation = [
    body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
    body('age').optional().isInt({ min: 1, max: 120 }).withMessage('Age must be between 1 and 120'),
    body('weight').optional().isFloat({ min: 20, max: 300 }).withMessage('Weight must be between 20 and 300 kg'),
    body('height').optional().isFloat({ min: 100, max: 250 }).withMessage('Height must be between 100 and 250 cm'),
    body('activityLevel').optional().isIn(['sedentary', 'lightly_active', 'moderately_active', 'very_active'])
        .withMessage('Activity level must be one of: sedentary, lightly_active, moderately_active, very_active'),
    body('weightGoal').optional().isIn(['lose_weight', 'maintain_weight', 'gain_weight'])
        .withMessage('Weight goal must be one of: lose_weight, maintain_weight, gain_weight'),
    body('workoutFrequency').optional().isIn(['0-2', '3-5', '6+'])
        .withMessage('Workout frequency must be one of: 0-2, 3-5, 6+'),
    body('weightLossSpeed').optional().isFloat({ min: 0.1, max: 2.0 })
        .withMessage('Weight loss speed must be between 0.1 and 2.0 kg per week'),
];

// Routes
router.post('/additional-info', authenticateToken, saveAdditionalInfoValidation, additionalInfoController.saveAdditionalInfo);
router.get('/additional-info', authenticateToken, additionalInfoController.getAdditionalInfo);
router.post('/mark-additional-info-completed', authenticateToken, additionalInfoController.markAdditionalInfoCompleted);

export default router; 