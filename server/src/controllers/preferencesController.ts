import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import User from '../models/User';
import { updateUserLastActivity } from '../services/streakService';
import errorLogger from '../services/errorLoggerService';

interface AuthRequest extends Request { user?: any }

export class PreferencesController {
    async getUserPreferences(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const user = await User.findById(userId).select('addBurnedCalories rolloverCalories');
            if (!user) {
                res.status(404).json({ success: false, message: 'User not found' });
                return;
            }

            res.json({
                success: true,
                data: {
                    addBurnedCalories: user.addBurnedCalories ?? true,
                    rolloverCalories: user.rolloverCalories ?? true,
                }
            });
        } catch (error) {
            errorLogger.error('Get user preferences error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    async updateUserPreferences(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ success: false, errors: errors.array() });
                return;
            }

            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const { addBurnedCalories, rolloverCalories } = req.body || {};

            const updateData: any = {};
            if (typeof addBurnedCalories === 'boolean') {
                updateData.addBurnedCalories = addBurnedCalories;
            }
            if (typeof rolloverCalories === 'boolean') {
                updateData.rolloverCalories = rolloverCalories;
            }

            if (Object.keys(updateData).length === 0) {
                res.status(400).json({ success: false, message: 'No valid preferences provided' });
                return;
            }

            const user = await User.findByIdAndUpdate(
                userId,
                updateData,
                { new: true, select: 'addBurnedCalories rolloverCalories' }
            );

            if (!user) {
                res.status(404).json({ success: false, message: 'User not found' });
                return;
            }

            // Update user's last activity
            try { await updateUserLastActivity(userId); } catch (_) { }

            res.json({
                success: true,
                data: {
                    addBurnedCalories: user.addBurnedCalories ?? true,
                    rolloverCalories: user.rolloverCalories ?? true,
                }
            });
        } catch (error) {
            errorLogger.error('Update user preferences error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
}