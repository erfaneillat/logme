import { Request, Response } from 'express';
import User from '../models/User';
import Subscription from '../models/Subscription';
import DailyLog from '../models/DailyLog';
import SubscriptionPlan from '../models/SubscriptionPlan';

/**
 * Get user analytics for specified time period
 */
export const getUserAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
        const { period = 'monthly' } = req.query;
        
        let groupFormat: string;
        let startDate = new Date();
        
        switch (period) {
            case 'daily':
                groupFormat = '%Y-%m-%d';
                startDate.setDate(startDate.getDate() - 30);
                break;
            case 'weekly':
                groupFormat = '%Y-W%U';
                startDate.setDate(startDate.getDate() - 84); // 12 weeks
                break;
            case 'yearly':
                groupFormat = '%Y';
                startDate.setFullYear(startDate.getFullYear() - 3);
                break;
            case 'monthly':
            default:
                groupFormat = '%Y-%m';
                startDate.setMonth(startDate.getMonth() - 12);
                break;
        }

        // User registrations over time
        const userRegistrations = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: groupFormat, date: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Active users over time (users who logged food)
        const activeUsers = await DailyLog.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        period: {
                            $dateToString: { format: groupFormat, date: '$createdAt' }
                        },
                        userId: '$userId'
                    }
                }
            },
            {
                $group: {
                    _id: '$_id.period',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Verified users over time
        const verifiedUsers = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    isPhoneVerified: true
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: groupFormat, date: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                registrations: userRegistrations.map(item => ({
                    period: item._id,
                    count: item.count
                })),
                activeUsers: activeUsers.map(item => ({
                    period: item._id,
                    count: item.count
                })),
                verifiedUsers: verifiedUsers.map(item => ({
                    period: item._id,
                    count: item.count
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching user analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user analytics',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Get subscription analytics for specified time period
 */
export const getSubscriptionAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
        const { period = 'monthly' } = req.query;
        
        let groupFormat: string;
        let startDate = new Date();
        
        switch (period) {
            case 'daily':
                groupFormat = '%Y-%m-%d';
                startDate.setDate(startDate.getDate() - 30);
                break;
            case 'weekly':
                groupFormat = '%Y-W%U';
                startDate.setDate(startDate.getDate() - 84);
                break;
            case 'yearly':
                groupFormat = '%Y';
                startDate.setFullYear(startDate.getFullYear() - 3);
                break;
            case 'monthly':
            default:
                groupFormat = '%Y-%m';
                startDate.setMonth(startDate.getMonth() - 12);
                break;
        }

        // New subscriptions over time
        const newSubscriptions = await Subscription.aggregate([
            {
                $match: {
                    startDate: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: groupFormat, date: '$startDate' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Active subscriptions over time
        const activeSubscriptions = await Subscription.aggregate([
            {
                $match: {
                    startDate: { $gte: startDate },
                    isActive: true
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: groupFormat, date: '$startDate' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Subscription by plan type
        const now = new Date();
        const subscriptionsByType = await Subscription.aggregate([
            {
                $match: {
                    isActive: true,
                    expiryDate: { $gte: now }
                }
            },
            {
                $group: {
                    _id: '$planType',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Revenue over time
        const plans = await SubscriptionPlan.find().select('cafebazaarProductKey price');
        const planPriceMap = new Map(plans.map(p => [p.cafebazaarProductKey, p.price]));

        const revenueOverTime = await Subscription.aggregate([
            {
                $match: {
                    startDate: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        period: {
                            $dateToString: { format: groupFormat, date: '$startDate' }
                        },
                        productKey: '$productKey',
                        planType: '$planType'
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.period': 1 }
            }
        ]);

        // Calculate revenue by period
        const revenueByPeriod = new Map<string, number>();
        revenueOverTime.forEach(item => {
            const price = planPriceMap.get(item._id.productKey) || 0;
            const revenue = price * item.count;
            const period = item._id.period;
            revenueByPeriod.set(period, (revenueByPeriod.get(period) || 0) + revenue);
        });

        const revenue = Array.from(revenueByPeriod.entries()).map(([period, amount]) => ({
            period,
            revenue: Math.round(amount)
        })).sort((a, b) => a.period.localeCompare(b.period));

        res.status(200).json({
            success: true,
            data: {
                newSubscriptions: newSubscriptions.map(item => ({
                    period: item._id,
                    count: item.count
                })),
                activeSubscriptions: activeSubscriptions.map(item => ({
                    period: item._id,
                    count: item.count
                })),
                subscriptionsByType: subscriptionsByType.map(item => ({
                    type: item._id,
                    count: item.count
                })),
                revenue
            }
        });
    } catch (error) {
        console.error('Error fetching subscription analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch subscription analytics',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Get activity analytics for specified time period
 */
export const getActivityAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
        const { period = 'monthly' } = req.query;
        
        let groupFormat: string;
        let startDate = new Date();
        
        switch (period) {
            case 'daily':
                groupFormat = '%Y-%m-%d';
                startDate.setDate(startDate.getDate() - 30);
                break;
            case 'weekly':
                groupFormat = '%Y-W%U';
                startDate.setDate(startDate.getDate() - 84);
                break;
            case 'yearly':
                groupFormat = '%Y';
                startDate.setFullYear(startDate.getFullYear() - 3);
                break;
            case 'monthly':
            default:
                groupFormat = '%Y-%m';
                startDate.setMonth(startDate.getMonth() - 12);
                break;
        }

        // Food logs over time
        const foodLogs = await DailyLog.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: groupFormat, date: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Image analyses over time
        const imageAnalyses = await DailyLog.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            { $unwind: '$items' },
            {
                $match: {
                    'items.imageUrl': { $ne: null, $exists: true }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: groupFormat, date: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Text analyses over time
        const textAnalyses = await DailyLog.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            { $unwind: '$items' },
            {
                $match: {
                    $or: [
                        { 'items.imageUrl': { $eq: null } },
                        { 'items.imageUrl': { $exists: false } }
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: groupFormat, date: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Training sessions over time
        const trainingSessions = await DailyLog.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    burnedCalories: { $gt: 0 }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: groupFormat, date: '$createdAt' }
                    },
                    count: { $sum: 1 },
                    totalCalories: { $sum: '$burnedCalories' }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                foodLogs: foodLogs.map(item => ({
                    period: item._id,
                    count: item.count
                })),
                imageAnalyses: imageAnalyses.map(item => ({
                    period: item._id,
                    count: item.count
                })),
                textAnalyses: textAnalyses.map(item => ({
                    period: item._id,
                    count: item.count
                })),
                trainingSessions: trainingSessions.map(item => ({
                    period: item._id,
                    count: item.count,
                    totalCalories: item.totalCalories
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching activity analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch activity analytics',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Get engagement analytics
 */
export const getEngagementAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
        const { period = 'monthly' } = req.query;
        
        let groupFormat: string;
        let startDate = new Date();
        
        switch (period) {
            case 'daily':
                groupFormat = '%Y-%m-%d';
                startDate.setDate(startDate.getDate() - 30);
                break;
            case 'weekly':
                groupFormat = '%Y-W%U';
                startDate.setDate(startDate.getDate() - 84);
                break;
            case 'yearly':
                groupFormat = '%Y';
                startDate.setFullYear(startDate.getFullYear() - 3);
                break;
            case 'monthly':
            default:
                groupFormat = '%Y-%m';
                startDate.setMonth(startDate.getMonth() - 12);
                break;
        }

        // Users who completed additional info over time
        const completedInfo = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    hasCompletedAdditionalInfo: true
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: groupFormat, date: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Users who generated plans over time
        const generatedPlans = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    hasGeneratedPlan: true
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: groupFormat, date: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Average logs per active user by period
        const avgLogsByPeriod = await DailyLog.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        period: {
                            $dateToString: { format: groupFormat, date: '$createdAt' }
                        },
                        userId: '$userId'
                    },
                    logCount: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: '$_id.period',
                    avgLogs: { $avg: '$logCount' },
                    totalUsers: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                completedInfo: completedInfo.map(item => ({
                    period: item._id,
                    count: item.count
                })),
                generatedPlans: generatedPlans.map(item => ({
                    period: item._id,
                    count: item.count
                })),
                avgLogs: avgLogsByPeriod.map(item => ({
                    period: item._id,
                    average: Math.round(item.avgLogs * 100) / 100,
                    activeUsers: item.totalUsers
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching engagement analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch engagement analytics',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
