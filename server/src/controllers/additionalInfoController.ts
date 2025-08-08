import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import AdditionalInfo from '../models/AdditionalInfo';
import User from '../models/User';

interface AuthRequest extends Request {
    user?: any;
}

export class AdditionalInfoController {
    // Save additional information
    async saveAdditionalInfo(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
                return;
            }

            const { gender, birthDate, age, weight, height, activityLevel, weightGoal, workoutFrequency, targetWeight, weightLossSpeed, diet, accomplishment, referralCode } = req.body;
            const userId = req.user.userId;

            // Check if user exists
            const user = await User.findById(userId);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }

            // Find existing additional info or create new one
            let additionalInfo = await AdditionalInfo.findOne({ userId });

            if (additionalInfo) {
                // Update existing additional info
                additionalInfo.gender = gender ?? additionalInfo.gender;
                if (birthDate) {
                    additionalInfo.birthDate = new Date(birthDate);
                }
                additionalInfo.age = age ?? additionalInfo.age;
                additionalInfo.weight = weight ?? additionalInfo.weight;
                additionalInfo.height = height ?? additionalInfo.height;
                additionalInfo.activityLevel = activityLevel ?? additionalInfo.activityLevel;
                additionalInfo.weightGoal = weightGoal ?? additionalInfo.weightGoal;
                additionalInfo.workoutFrequency = workoutFrequency ?? additionalInfo.workoutFrequency;
                additionalInfo.targetWeight = targetWeight ?? additionalInfo.targetWeight;
                additionalInfo.weightLossSpeed = weightLossSpeed ?? additionalInfo.weightLossSpeed;
                additionalInfo.diet = diet ?? additionalInfo.diet;
                additionalInfo.accomplishment = accomplishment ?? additionalInfo.accomplishment;
                additionalInfo.referralCode = referralCode ?? additionalInfo.referralCode;
                await additionalInfo.save();
            } else {
                // Create new additional info
                additionalInfo = new AdditionalInfo({
                    userId,
                    gender,
                    birthDate: birthDate ? new Date(birthDate) : undefined,
                    age,
                    weight,
                    height,
                    activityLevel,
                    weightGoal,
                    workoutFrequency,
                    targetWeight,
                    weightLossSpeed,
                    diet,
                    accomplishment,
                    referralCode,
                });
                await additionalInfo.save();
            }

            res.json({
                success: true,
                message: 'Additional information saved successfully',
                data: { additionalInfo }
            });
        } catch (error) {
            console.error('Save additional info error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get additional information
    async getAdditionalInfo(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user.userId;

            // Check if user exists
            const user = await User.findById(userId);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }

            const additionalInfo = await AdditionalInfo.findOne({ userId });

            res.json({
                success: true,
                data: { additionalInfo }
            });
        } catch (error) {
            console.error('Get additional info error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Mark additional information as completed
    async markAdditionalInfoCompleted(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user.userId;

            // Check if user exists
            const user = await User.findById(userId);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }

            // Check if additional info exists and is complete
            const additionalInfo = await AdditionalInfo.findOne({ userId });
            if (!additionalInfo) {
                res.status(400).json({
                    success: false,
                    message: 'Additional information not found'
                });
                return;
            }

            // Check if all required fields are filled
            const baseComplete = !!(additionalInfo.gender && additionalInfo.birthDate && additionalInfo.weight &&
                additionalInfo.height && additionalInfo.activityLevel && additionalInfo.weightGoal &&
                additionalInfo.workoutFrequency && additionalInfo.targetWeight && additionalInfo.diet && additionalInfo.accomplishment);

            const requiresSpeed = additionalInfo.weightGoal === 'lose_weight' || additionalInfo.weightGoal === 'gain_weight';
            const hasSpeed = !!additionalInfo.weightLossSpeed;

            if (!baseComplete || (requiresSpeed && !hasSpeed)) {
                res.status(400).json({
                    success: false,
                    message: 'Additional information is incomplete'
                });
                return;
            }

            // Mark user as having completed additional info
            user.hasCompletedAdditionalInfo = true;
            await user.save();

            res.json({
                success: true,
                message: 'Additional information marked as completed'
            });
        } catch (error) {
            console.error('Mark additional info completed error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
} 