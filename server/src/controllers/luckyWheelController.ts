import { Request, Response } from 'express';
import LuckyWheelEvent from '../models/LuckyWheelEvent';
import User from '../models/User';

interface AuthRequest extends Request {
    user?: {
        userId: string;
    };
}

export class LuckyWheelController {
    /**
     * Log when a user views the lucky wheel
     * POST /api/lucky-wheel/view
     */
    public async logLuckyWheelView(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }

            // Check if user exists
            const user = await User.findById(userId);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
                return;
            }

            // Check if user already viewed the lucky wheel today
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

            const existingEvent = await LuckyWheelEvent.findOne({
                userId: userId,
                viewedAt: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            });

            if (existingEvent) {
                res.status(200).json({
                    success: true,
                    message: 'Lucky wheel view already logged for today',
                    data: {
                        eventId: existingEvent._id,
                        viewedAt: existingEvent.viewedAt,
                        isFirstViewToday: false
                    }
                });
                return;
            }

            // Create new lucky wheel view event
            const luckyWheelEvent = new LuckyWheelEvent({
                userId: userId,
                viewedAt: new Date()
            });

            await luckyWheelEvent.save();

            res.status(201).json({
                success: true,
                message: 'Lucky wheel view logged successfully',
                data: {
                    eventId: luckyWheelEvent._id,
                    viewedAt: luckyWheelEvent.viewedAt,
                    isFirstViewToday: true
                }
            });

        } catch (error) {
            console.error('Error logging lucky wheel view:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Get lucky wheel view history for a user
     * GET /api/lucky-wheel/history
     */
    public async getLuckyWheelHistory(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const skip = (page - 1) * limit;

            const events = await LuckyWheelEvent.find({ userId })
                .sort({ viewedAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('viewedAt createdAt')
                .lean();

            const totalEvents = await LuckyWheelEvent.countDocuments({ userId });
            const totalPages = Math.ceil(totalEvents / limit);

            res.status(200).json({
                success: true,
                data: {
                    events,
                    pagination: {
                        currentPage: page,
                        totalPages,
                        totalEvents,
                        hasNextPage: page < totalPages,
                        hasPrevPage: page > 1
                    }
                }
            });

        } catch (error) {
            console.error('Error fetching lucky wheel history:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Get lucky wheel statistics for a user
     * GET /api/lucky-wheel/stats
     */
    public async getLuckyWheelStats(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }

            const totalViews = await LuckyWheelEvent.countDocuments({ userId });

            // Get first view date
            const firstView = await LuckyWheelEvent.findOne({ userId })
                .sort({ viewedAt: 1 })
                .select('viewedAt')
                .lean();

            // Get last view date
            const lastView = await LuckyWheelEvent.findOne({ userId })
                .sort({ viewedAt: -1 })
                .select('viewedAt')
                .lean();

            // Get views in the last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const viewsLast30Days = await LuckyWheelEvent.countDocuments({
                userId,
                viewedAt: { $gte: thirtyDaysAgo }
            });

            res.status(200).json({
                success: true,
                data: {
                    totalViews,
                    firstViewDate: firstView?.viewedAt || null,
                    lastViewDate: lastView?.viewedAt || null,
                    viewsLast30Days
                }
            });

        } catch (error) {
            console.error('Error fetching lucky wheel stats:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}
