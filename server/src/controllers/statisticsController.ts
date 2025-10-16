import { Request, Response } from 'express';
import User from '../models/User';
import Subscription from '../models/Subscription';
import DailyLog from '../models/DailyLog';
import SubscriptionPlan from '../models/SubscriptionPlan';
import errorLogger from '../services/errorLoggerService';

/**
 * Get dashboard statistics
 */
export const getDashboardStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
        // Get total users count
        const totalUsers = await User.countDocuments();

        // Get users registered in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newUsersLast30Days = await User.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });

        // Get active subscribers (subscriptions that haven't expired)
        const now = new Date();
        const activeSubscriptions = await Subscription.countDocuments({
            isActive: true,
            expiryDate: { $gte: now }
        });

        // Get total subscriptions count
        const totalSubscriptions = await Subscription.countDocuments();

        // Get subscription breakdown by plan type
        const subscriptionByPlan = await Subscription.aggregate([
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

        const monthlySubscribers = subscriptionByPlan.find(s => s._id === 'monthly')?.count || 0;
        const yearlySubscribers = subscriptionByPlan.find(s => s._id === 'yearly')?.count || 0;

        // Get total daily logs count
        const totalDailyLogs = await DailyLog.countDocuments();

        // Get users who completed additional info
        const usersCompletedInfo = await User.countDocuments({
            hasCompletedAdditionalInfo: true
        });

        // Get users who generated plans
        const usersWithPlans = await User.countDocuments({
            hasGeneratedPlan: true
        });

        // Count total analyzed images (items with imageUrl)
        const imageAnalysisResult = await DailyLog.aggregate([
            { $unwind: '$items' },
            { $match: { 'items.imageUrl': { $ne: null, $exists: true } } },
            { $count: 'total' }
        ]);
        const totalImageAnalyses = imageAnalysisResult[0]?.total || 0;

        // Count total text analyses (items without imageUrl)
        const textAnalysisResult = await DailyLog.aggregate([
            { $unwind: '$items' },
            { $match: { 
                $or: [
                    { 'items.imageUrl': { $eq: null } },
                    { 'items.imageUrl': { $exists: false } }
                ]
            } },
            { $count: 'total' }
        ]);
        const totalTextAnalyses = textAnalysisResult[0]?.total || 0;

        // Count total training sessions (logs with burnedCalories > 0)
        const totalTrainingSessions = await DailyLog.countDocuments({
            burnedCalories: { $gt: 0 }
        });

        // Get recent users (last 5)
        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('phone name createdAt isPhoneVerified');

        // Get recent subscriptions (last 5)
        const recentSubscriptions = await Subscription.find()
            .populate('userId', 'phone name')
            .sort({ createdAt: -1 })
            .limit(5)
            .select('userId planType startDate expiryDate isActive');

        // Get subscription plans
        const subscriptionPlans = await SubscriptionPlan.find().select('name price duration isActive');

        // Calculate daily logs per user average
        const avgLogsPerUser = totalUsers > 0 ? (totalDailyLogs / totalUsers).toFixed(2) : 0;

        // Get logs created in last 30 days
        const recentLogsCount = await DailyLog.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });

        // Calculate conversion rate (users with subscriptions / total users)
        const conversionRate = totalUsers > 0 
            ? ((activeSubscriptions / totalUsers) * 100).toFixed(2) 
            : '0';

        res.status(200).json({
            success: true,
            data: {
                overview: {
                    totalUsers,
                    newUsersLast30Days,
                    activeSubscriptions,
                    totalSubscriptions,
                    totalDailyLogs,
                    usersCompletedInfo,
                    usersWithPlans,
                    avgLogsPerUser: Number(avgLogsPerUser),
                    recentLogsCount,
                    conversionRate: Number(conversionRate),
                    totalImageAnalyses,
                    totalTextAnalyses,
                    totalTrainingSessions
                },
                subscriptions: {
                    monthly: monthlySubscribers,
                    yearly: yearlySubscribers,
                    total: activeSubscriptions
                },
                recentUsers,
                recentSubscriptions,
                subscriptionPlans
            }
        });
    } catch (error) {
        errorLogger.error('Error fetching dashboard statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard statistics',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Get user growth statistics
 */
export const getUserGrowth = async (req: Request, res: Response): Promise<void> => {
    try {
        const { days = 30 } = req.query;
        const daysNum = parseInt(days as string, 10);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysNum);

        // Get daily user registrations
        const userGrowth = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
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
            data: userGrowth.map(item => ({
                date: item._id,
                count: item.count
            }))
        });
    } catch (error) {
        errorLogger.error('Error fetching user growth:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user growth statistics',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * Get subscription revenue statistics (estimated based on plan prices)
 */
export const getRevenueStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
        const now = new Date();

        // Get all active subscriptions with plan details
        const activeSubscriptions = await Subscription.find({
            isActive: true,
            expiryDate: { $gte: now }
        }).select('planType productKey');

        // Get plan prices
        const plans = await SubscriptionPlan.find().select('cafebazaarProductKey price');
        const planPriceMap = new Map(plans.map(p => [p.cafebazaarProductKey, p.price]));

        // Calculate estimated monthly recurring revenue
        let monthlyRevenue = 0;
        let yearlyRevenue = 0;

        activeSubscriptions.forEach(sub => {
            const price = planPriceMap.get(sub.productKey) || 0;
            if (sub.planType === 'monthly') {
                monthlyRevenue += price;
            } else if (sub.planType === 'yearly') {
                yearlyRevenue += price;
                monthlyRevenue += price / 12; // Amortize yearly to monthly
            }
        });

        res.status(200).json({
            success: true,
            data: {
                estimatedMonthlyRevenue: Math.round(monthlyRevenue),
                estimatedYearlyRevenue: Math.round(yearlyRevenue),
                totalActiveSubscriptions: activeSubscriptions.length
            }
        });
    } catch (error) {
        errorLogger.error('Error fetching revenue statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch revenue statistics',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
