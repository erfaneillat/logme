import Subscription from '../models/Subscription';
import DailyAnalysisLimit from '../models/DailyAnalysisLimit';
import { getTomorrowJalaliPersian, getCurrentTimePersian } from '../utils/jalali_date';

// Maximum daily analyses allowed for free users
// Maximum daily analyses allowed for free users
const FREE_USER_DAILY_LIMIT = process.env.NODE_ENV === 'production' ? 2 : 100;

export class ImageAnalysisLimitService {
    /**
     * Check if a free user has reached their daily image analysis limit
     * Returns { canAnalyze: boolean, remaining: number, nextResetTime: Date }
     */
    static async checkAndTrackAnalysis(userId: string, _ignoredDate?: string): Promise<{
        canAnalyze: boolean;
        remaining: number;
        nextResetTime: Date;
        message?: string;
    }> {
        try {
            // Check if user has active subscription
            const activeSubscription = await Subscription.findOne({
                userId,
                isActive: true,
                expiryDate: { $gt: new Date() },
            });

            // If user has active subscription, allow unlimited analyses
            if (activeSubscription) {
                return {
                    canAnalyze: true,
                    remaining: -1, // Unlimited
                    nextResetTime: activeSubscription.expiryDate,
                };
            }

            // User is free tier - check daily limit
            // Always use SERVER LOCAL date (YYYY-MM-DD) for limiting, ignoring any client-provided date
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const d = String(now.getDate()).padStart(2, '0');
            const serverTodayIso = `${y}-${m}-${d}`;

            // Get or create today's analysis record based on server date
            const limit = await DailyAnalysisLimit.findOneAndUpdate(
                { userId, date: serverTodayIso },
                { userId, date: serverTodayIso },
                { upsert: true, new: true }
            );

            const remaining = Math.max(0, FREE_USER_DAILY_LIMIT - (limit?.analysisCount || 0));
            const canAnalyze = remaining > 0;

            // Get next reset time (tomorrow at midnight)
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            return {
                canAnalyze,
                remaining,
                nextResetTime: tomorrow,
            };
        } catch (error) {
            console.error('Error checking analysis limit:', error);
            // Default to allowing on error (fail-open)
            return {
                canAnalyze: true,
                remaining: FREE_USER_DAILY_LIMIT,
                nextResetTime: new Date(),
            };
        }
    }

    /**
     * Increment the analysis count for today
     */
    static async incrementAnalysisCount(userId: string, _ignoredDate?: string): Promise<void> {
        try {
            // Always increment against server local date (YYYY-MM-DD)
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const d = String(now.getDate()).padStart(2, '0');
            const serverTodayIso = `${y}-${m}-${d}`;

            await DailyAnalysisLimit.findOneAndUpdate(
                { userId, date: serverTodayIso },
                {
                    $inc: { analysisCount: 1 },
                    userId,
                    date: serverTodayIso,
                },
                { upsert: true, new: true }
            );
        } catch (error) {
            console.error('Error incrementing analysis count:', error);
            // Non-blocking - don't throw
        }
    }

    /**
     * Get tomorrow's date formatted as YYYY-MM-DD
     */
    static getTomorrowDateFormatted(): string {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const year = tomorrow.getFullYear();
        const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const day = String(tomorrow.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Get free tier limit
     */
    static getFreeUserDailyLimit(): number {
        return FREE_USER_DAILY_LIMIT;
    }

    /**
     * Format date for display
     */
    static formatDateForDisplay(dateString: string): string {
        // dateString format: YYYY-MM-DD
        // This can be customized for different locales
        return dateString;
    }

    /**
     * Get Persian (Farsi) error message with Jalali date and time
     */
    static getPersianErrorMessage(): string {
        const tomorrowJalali = getTomorrowJalaliPersian();
        const currentTime = getCurrentTimePersian();
        return `شما به حد رایگان روزانه رسیدید (۲ تصویر) 🎯\nتمدید فردا: ${tomorrowJalali} ساعت ${currentTime}\nبرای تحلیل نامحدود، اشتراک بگیرید 🚀`;
    }

    /**
     * Get English error message with tomorrow's date
     */
    static getEnglishErrorMessage(tomorrowDate: string): string {
        return `You've reached your daily limit (2 images) 🎯\nResets tomorrow: ${tomorrowDate}\nSubscribe for unlimited analysis 🚀`;
    }
}
