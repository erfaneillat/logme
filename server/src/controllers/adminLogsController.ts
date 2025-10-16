import { Request, Response } from 'express';
import DailyLog from '../models/DailyLog';
import User from '../models/User';
import errorLogger from '../services/errorLoggerService';

interface AuthRequest extends Request { user?: any }

export class AdminLogsController {
    async getAllLogs(req: AuthRequest, res: Response): Promise<void> {
        try {
            const page = parseInt((req.query.page as string) || '1', 10);
            const limit = parseInt((req.query.limit as string) || '20', 10);
            const type = req.query.type as string; // 'image', 'text', or undefined for all
            const skip = (page - 1) * limit;

            // Build query
            const query: any = {};
            
            // Filter by type
            if (type === 'image') {
                query['items.imageUrl'] = { $exists: true, $ne: null };
            } else if (type === 'text') {
                query['items.imageUrl'] = { $exists: false };
            }

            // Get logs with user information
            const logs = await DailyLog.find(query)
                .populate('userId', 'phone name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            const total = await DailyLog.countDocuments(query);

            // Process logs to flatten items for easier display
            const processedLogs: any[] = [];
            for (const log of logs) {
                const user = log.userId as any;
                for (const item of log.items || []) {
                    const itemData = item as any;
                    processedLogs.push({
                        _id: itemData._id,
                        userId: user?._id,
                        userName: user?.name,
                        userPhone: user?.phone,
                        date: log.date,
                        type: item.imageUrl ? 'image' : 'text',
                        imageUrl: item.imageUrl,
                        title: item.title,
                        calories: item.calories,
                        carbsGrams: item.carbsGrams,
                        proteinGrams: item.proteinGrams,
                        fatsGrams: item.fatsGrams,
                        healthScore: item.healthScore,
                        portions: item.portions,
                        ingredients: item.ingredients,
                        timeIso: item.timeIso,
                        liked: item.liked,
                        createdAt: log.createdAt,
                    });
                }
            }

            // Sort by timeIso descending
            processedLogs.sort((a, b) => {
                const timeA = new Date(a.timeIso).getTime();
                const timeB = new Date(b.timeIso).getTime();
                return timeB - timeA;
            });

            // Paginate the flattened items
            const paginatedLogs = processedLogs.slice(0, limit);

            res.json({
                success: true,
                data: {
                    logs: paginatedLogs,
                    pagination: {
                        page,
                        limit,
                        total: processedLogs.length,
                        totalPages: Math.ceil(processedLogs.length / limit),
                    },
                },
            });
        } catch (error) {
            errorLogger.error('Get all logs error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    async getLogStats(req: AuthRequest, res: Response): Promise<void> {
        try {
            // Get total counts
            const totalLogs = await DailyLog.countDocuments();
            
            // Count items with images vs text
            const logsWithImages = await DailyLog.aggregate([
                { $unwind: '$items' },
                {
                    $group: {
                        _id: null,
                        totalItems: { $sum: 1 },
                        imageItems: {
                            $sum: {
                                $cond: [
                                    { $and: [{ $ne: ['$items.imageUrl', null] }, { $ne: ['$items.imageUrl', ''] }] },
                                    1,
                                    0
                                ]
                            }
                        },
                        textItems: {
                            $sum: {
                                $cond: [
                                    { $or: [{ $eq: ['$items.imageUrl', null] }, { $eq: ['$items.imageUrl', ''] }] },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                }
            ]);

            const stats = logsWithImages[0] || { totalItems: 0, imageItems: 0, textItems: 0 };

            res.json({
                success: true,
                data: {
                    totalLogs,
                    totalItems: stats.totalItems,
                    imageAnalyses: stats.imageItems,
                    textAnalyses: stats.textItems,
                },
            });
        } catch (error) {
            errorLogger.error('Get log stats error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    async searchLogs(req: AuthRequest, res: Response): Promise<void> {
        try {
            const searchTerm = req.query.q as string;
            const page = parseInt((req.query.page as string) || '1', 10);
            const limit = parseInt((req.query.limit as string) || '20', 10);
            const skip = (page - 1) * limit;

            if (!searchTerm || searchTerm.trim().length === 0) {
                res.status(400).json({ success: false, message: 'Search term is required' });
                return;
            }

            // Search in user phone, name, or item titles
            const users = await User.find({
                $or: [
                    { phone: { $regex: searchTerm, $options: 'i' } },
                    { name: { $regex: searchTerm, $options: 'i' } },
                ],
            }).select('_id');

            const userIds = users.map(u => u._id);

            const logs = await DailyLog.find({
                $or: [
                    { userId: { $in: userIds } },
                    { 'items.title': { $regex: searchTerm, $options: 'i' } },
                ],
            })
                .populate('userId', 'phone name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            const total = await DailyLog.countDocuments({
                $or: [
                    { userId: { $in: userIds } },
                    { 'items.title': { $regex: searchTerm, $options: 'i' } },
                ],
            });

            // Process logs to flatten items
            const processedLogs: any[] = [];
            for (const log of logs) {
                const user = log.userId as any;
                for (const item of log.items || []) {
                    const itemData = item as any;
                    processedLogs.push({
                        _id: itemData._id,
                        userId: user?._id,
                        userName: user?.name,
                        userPhone: user?.phone,
                        date: log.date,
                        type: item.imageUrl ? 'image' : 'text',
                        imageUrl: item.imageUrl,
                        title: item.title,
                        calories: item.calories,
                        carbsGrams: item.carbsGrams,
                        proteinGrams: item.proteinGrams,
                        fatsGrams: item.fatsGrams,
                        healthScore: item.healthScore,
                        portions: item.portions,
                        ingredients: item.ingredients,
                        timeIso: item.timeIso,
                        liked: item.liked,
                        createdAt: log.createdAt,
                    });
                }
            }

            res.json({
                success: true,
                data: {
                    logs: processedLogs,
                    pagination: {
                        page,
                        limit,
                        total: processedLogs.length,
                        totalPages: Math.ceil(processedLogs.length / limit),
                    },
                },
            });
        } catch (error) {
            errorLogger.error('Search logs error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    async getUserLogs(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const page = parseInt((req.query.page as string) || '1', 10);
            const limit = parseInt((req.query.limit as string) || '20', 10);
            const skip = (page - 1) * limit;

            if (!userId) {
                res.status(400).json({ success: false, message: 'User ID is required' });
                return;
            }

            // Get logs for specific user
            const logs = await DailyLog.find({ userId })
                .populate('userId', 'phone name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            const total = await DailyLog.countDocuments({ userId });

            // Process logs to flatten items
            const processedLogs: any[] = [];
            for (const log of logs) {
                const user = log.userId as any;
                for (const item of log.items || []) {
                    const itemData = item as any;
                    processedLogs.push({
                        _id: itemData._id,
                        userId: user?._id,
                        userName: user?.name,
                        userPhone: user?.phone,
                        date: log.date,
                        type: item.imageUrl ? 'image' : 'text',
                        imageUrl: item.imageUrl,
                        title: item.title,
                        calories: item.calories,
                        carbsGrams: item.carbsGrams,
                        proteinGrams: item.proteinGrams,
                        fatsGrams: item.fatsGrams,
                        healthScore: item.healthScore,
                        portions: item.portions,
                        ingredients: item.ingredients,
                        timeIso: item.timeIso,
                        liked: item.liked,
                        createdAt: log.createdAt,
                    });
                }
            }

            // Sort by timeIso descending
            processedLogs.sort((a, b) => {
                const timeA = new Date(a.timeIso).getTime();
                const timeB = new Date(b.timeIso).getTime();
                return timeB - timeA;
            });

            res.json({
                success: true,
                data: {
                    logs: processedLogs,
                    pagination: {
                        page,
                        limit,
                        total: processedLogs.length,
                        totalPages: Math.ceil(processedLogs.length / limit),
                    },
                },
            });
        } catch (error) {
            errorLogger.error('Get user logs error:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
}
