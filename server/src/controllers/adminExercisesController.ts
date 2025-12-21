import { Request, Response } from 'express';
import ExerciseLog from '../models/ExerciseLog';
import User from '../models/User';
import errorLogger from '../services/errorLoggerService';

interface AuthRequest extends Request { user?: any }

export interface ExerciseLogItem {
    _id: string;
    userId: string;
    userName?: string;
    userPhone: string;
    date: string;
    activityName: string;
    activityDescription: string;
    duration: number;
    caloriesBurned: number;
    intensity: string;
    tips: string[];
    timeIso: string;
    createdAt: string;
}

export interface ExerciseLogsResponse {
    exercises: ExerciseLogItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface ExerciseStats {
    totalExercises: number;
    totalCaloriesBurned: number;
    totalDuration: number;
    uniqueUsers: number;
    intensityBreakdown: {
        low: number;
        moderate: number;
        high: number;
    };
}

export class AdminExercisesController {
    async getAllExercises(req: AuthRequest, res: Response): Promise<void> {
        try {
            const page = parseInt((req.query.page as string) || '1', 10);
            const limit = parseInt((req.query.limit as string) || '20', 10);
            const intensity = req.query.intensity as string; // 'کم', 'متوسط', 'زیاد', or undefined for all
            const skip = (page - 1) * limit;

            // Build query
            const query: any = {};

            if (intensity) {
                query.intensity = intensity;
            }

            // Get exercises with user information
            const exercises = await ExerciseLog.find(query)
                .populate('userId', 'phone name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            const total = await ExerciseLog.countDocuments(query);

            // Process exercises for easier display
            const processedExercises: ExerciseLogItem[] = exercises.map((exercise: any) => {
                const user = exercise.userId as any;
                return {
                    _id: exercise._id.toString(),
                    userId: user?._id?.toString() || '',
                    userName: user?.name,
                    userPhone: user?.phone,
                    date: exercise.date,
                    activityName: exercise.activityName,
                    activityDescription: exercise.activityDescription,
                    duration: exercise.duration,
                    caloriesBurned: exercise.caloriesBurned,
                    intensity: exercise.intensity,
                    tips: exercise.tips || [],
                    timeIso: exercise.timeIso,
                    createdAt: exercise.createdAt?.toISOString() || '',
                };
            });

            res.json({
                success: true,
                data: {
                    exercises: processedExercises,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit),
                    },
                },
            });
        } catch (error) {
            errorLogger.error('Get all exercises error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    async getExerciseStats(req: AuthRequest, res: Response): Promise<void> {
        try {
            // Get total counts and aggregations
            const totalExercises = await ExerciseLog.countDocuments();

            // Aggregation for stats
            const aggregation = await ExerciseLog.aggregate([
                {
                    $group: {
                        _id: null,
                        totalCaloriesBurned: { $sum: '$caloriesBurned' },
                        totalDuration: { $sum: '$duration' },
                        uniqueUsers: { $addToSet: '$userId' },
                        lowIntensity: {
                            $sum: { $cond: [{ $eq: ['$intensity', 'کم'] }, 1, 0] }
                        },
                        moderateIntensity: {
                            $sum: { $cond: [{ $eq: ['$intensity', 'متوسط'] }, 1, 0] }
                        },
                        highIntensity: {
                            $sum: { $cond: [{ $eq: ['$intensity', 'زیاد'] }, 1, 0] }
                        }
                    }
                }
            ]);

            const stats = aggregation[0] || {
                totalCaloriesBurned: 0,
                totalDuration: 0,
                uniqueUsers: [],
                lowIntensity: 0,
                moderateIntensity: 0,
                highIntensity: 0
            };

            res.json({
                success: true,
                data: {
                    totalExercises,
                    totalCaloriesBurned: stats.totalCaloriesBurned,
                    totalDuration: stats.totalDuration,
                    uniqueUsers: Array.isArray(stats.uniqueUsers) ? stats.uniqueUsers.length : 0,
                    intensityBreakdown: {
                        low: stats.lowIntensity,
                        moderate: stats.moderateIntensity,
                        high: stats.highIntensity,
                    },
                },
            });
        } catch (error) {
            errorLogger.error('Get exercise stats error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    async searchExercises(req: AuthRequest, res: Response): Promise<void> {
        try {
            const searchTerm = req.query.q as string;
            const page = parseInt((req.query.page as string) || '1', 10);
            const limit = parseInt((req.query.limit as string) || '20', 10);
            const skip = (page - 1) * limit;

            if (!searchTerm || searchTerm.trim().length === 0) {
                res.status(400).json({ success: false, message: 'Search term is required' });
                return;
            }

            // Search in user phone, name, or activity names
            const users = await User.find({
                $or: [
                    { phone: { $regex: searchTerm, $options: 'i' } },
                    { name: { $regex: searchTerm, $options: 'i' } },
                ],
            }).select('_id');

            const userIds = users.map(u => u._id);

            const exercises = await ExerciseLog.find({
                $or: [
                    { userId: { $in: userIds } },
                    { activityName: { $regex: searchTerm, $options: 'i' } },
                    { activityDescription: { $regex: searchTerm, $options: 'i' } },
                ],
            })
                .populate('userId', 'phone name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            const total = await ExerciseLog.countDocuments({
                $or: [
                    { userId: { $in: userIds } },
                    { activityName: { $regex: searchTerm, $options: 'i' } },
                    { activityDescription: { $regex: searchTerm, $options: 'i' } },
                ],
            });

            // Process exercises for easier display
            const processedExercises: ExerciseLogItem[] = exercises.map((exercise: any) => {
                const user = exercise.userId as any;
                return {
                    _id: exercise._id.toString(),
                    userId: user?._id?.toString() || '',
                    userName: user?.name,
                    userPhone: user?.phone,
                    date: exercise.date,
                    activityName: exercise.activityName,
                    activityDescription: exercise.activityDescription,
                    duration: exercise.duration,
                    caloriesBurned: exercise.caloriesBurned,
                    intensity: exercise.intensity,
                    tips: exercise.tips || [],
                    timeIso: exercise.timeIso,
                    createdAt: exercise.createdAt?.toISOString() || '',
                };
            });

            res.json({
                success: true,
                data: {
                    exercises: processedExercises,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit),
                    },
                },
            });
        } catch (error) {
            errorLogger.error('Search exercises error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    async getUserExercises(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const page = parseInt((req.query.page as string) || '1', 10);
            const limit = parseInt((req.query.limit as string) || '20', 10);
            const skip = (page - 1) * limit;

            if (!userId) {
                res.status(400).json({ success: false, message: 'User ID is required' });
                return;
            }

            // Get exercises for specific user
            const exercises = await ExerciseLog.find({ userId })
                .populate('userId', 'phone name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            const total = await ExerciseLog.countDocuments({ userId });

            // Process exercises for easier display
            const processedExercises: ExerciseLogItem[] = exercises.map((exercise: any) => {
                const user = exercise.userId as any;
                return {
                    _id: exercise._id.toString(),
                    userId: user?._id?.toString() || '',
                    userName: user?.name,
                    userPhone: user?.phone,
                    date: exercise.date,
                    activityName: exercise.activityName,
                    activityDescription: exercise.activityDescription,
                    duration: exercise.duration,
                    caloriesBurned: exercise.caloriesBurned,
                    intensity: exercise.intensity,
                    tips: exercise.tips || [],
                    timeIso: exercise.timeIso,
                    createdAt: exercise.createdAt?.toISOString() || '',
                };
            });

            res.json({
                success: true,
                data: {
                    exercises: processedExercises,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit),
                    },
                },
            });
        } catch (error) {
            errorLogger.error('Get user exercises error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
}
