import { API_BASE_URL, API_TIMEOUT } from '../config/api';
import { errorLogger } from './errorLogger.service';

export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface TimeSeriesData {
    period: string;
    count: number;
}

export interface UserAnalytics {
    registrations: TimeSeriesData[];
    activeUsers: TimeSeriesData[];
    verifiedUsers: TimeSeriesData[];
}

export interface SubscriptionAnalytics {
    newSubscriptions: TimeSeriesData[];
    activeSubscriptions: TimeSeriesData[];
    subscriptionsByType: Array<{
        type: string;
        count: number;
    }>;
    revenue: Array<{
        period: string;
        revenue: number;
    }>;
}

export interface ActivityAnalytics {
    foodLogs: TimeSeriesData[];
    imageAnalyses: TimeSeriesData[];
    textAnalyses: TimeSeriesData[];
    trainingSessions: Array<{
        period: string;
        count: number;
        totalCalories: number;
    }>;
}

export interface EngagementAnalytics {
    completedInfo: TimeSeriesData[];
    generatedPlans: TimeSeriesData[];
    avgLogs: Array<{
        period: string;
        average: number;
        activeUsers: number;
    }>;
}

export interface CostAnalytics {
    totalCost: number;
    avgCost: number;
    usersWithCost: number;
    topUsers: Array<{
        phone: string;
        name: string;
        cost: number;
        createdAt: string;
    }>;
    costOverTime: Array<{
        period: string;
        totalCost: number;
        userCount: number;
        avgCost: number;
    }>;
}

export interface KitchenAnalytics {
    summary: {
        totalClicks: number;
        uniqueItemsClicked: number;
        uniqueUsersClicked: number;
    };
    topItems: Array<{
        _id: string;
        name: string;
        categoryId: string;
        categoryTitle: string;
        subCategoryTitle: string;
        clickCount: number;
        uniqueUserCount: number;
        lastClicked: string;
    }>;
    categorySummary: Array<{
        _id: string;
        categoryTitle: string;
        totalClicks: number;
        uniqueItemCount: number;
    }>;
    clicksOverTime: Array<{
        _id: string;
        count: number;
    }>;
}

class AnalyticsService {
    private async fetchWithTimeout(url: string, options: RequestInit = {}) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });
            clearTimeout(timeout);
            return response;
        } catch (error) {
            clearTimeout(timeout);
            throw error;
        }
    }

    private getAuthHeaders(token: string) {
        return {
            Authorization: `Bearer ${token}`,
        };
    }

    async getUserAnalytics(token: string, period: TimePeriod = 'monthly'): Promise<UserAnalytics> {
        try {
            const response = await this.fetchWithTimeout(
                `${API_BASE_URL}/api/analytics/users?period=${period}`,
                {
                    method: 'GET',
                    headers: this.getAuthHeaders(token),
                }
            );
            const data = await response.json();
            return data.data;
        } catch (error) {
            errorLogger.error('Error fetching user analytics:', error);
            throw error;
        }
    }

    async getSubscriptionAnalytics(token: string, period: TimePeriod = 'monthly'): Promise<SubscriptionAnalytics> {
        try {
            const response = await this.fetchWithTimeout(
                `${API_BASE_URL}/api/analytics/subscriptions?period=${period}`,
                {
                    method: 'GET',
                    headers: this.getAuthHeaders(token),
                }
            );
            const data = await response.json();
            return data.data;
        } catch (error) {
            errorLogger.error('Error fetching subscription analytics:', error);
            throw error;
        }
    }

    async getActivityAnalytics(token: string, period: TimePeriod = 'monthly'): Promise<ActivityAnalytics> {
        try {
            const response = await this.fetchWithTimeout(
                `${API_BASE_URL}/api/analytics/activity?period=${period}`,
                {
                    method: 'GET',
                    headers: this.getAuthHeaders(token),
                }
            );
            const data = await response.json();
            return data.data;
        } catch (error) {
            errorLogger.error('Error fetching activity analytics:', error);
            throw error;
        }
    }

    async getEngagementAnalytics(token: string, period: TimePeriod = 'monthly'): Promise<EngagementAnalytics> {
        try {
            const response = await this.fetchWithTimeout(
                `${API_BASE_URL}/api/analytics/engagement?period=${period}`,
                {
                    method: 'GET',
                    headers: this.getAuthHeaders(token),
                }
            );
            const data = await response.json();
            return data.data;
        } catch (error) {
            errorLogger.error('Error fetching engagement analytics:', error);
            throw error;
        }
    }

    async getCostAnalytics(token: string, period: TimePeriod = 'monthly'): Promise<CostAnalytics> {
        try {
            const response = await this.fetchWithTimeout(
                `${API_BASE_URL}/api/analytics/costs?period=${period}`,
                {
                    method: 'GET',
                    headers: this.getAuthHeaders(token),
                }
            );
            const data = await response.json();
            return data.data;
        } catch (error) {
            errorLogger.error('Error fetching cost analytics:', error);
            throw error;
        }
    }

    async getKitchenAnalytics(token: string): Promise<KitchenAnalytics> {
        try {
            const response = await this.fetchWithTimeout(
                `${API_BASE_URL}/api/kitchen/admin/analytics`,
                {
                    method: 'GET',
                    headers: this.getAuthHeaders(token),
                }
            );
            const data = await response.json();
            return data.data;
        } catch (error) {
            errorLogger.error('Error fetching kitchen analytics:', error);
            throw error;
        }
    }
}

export const analyticsService = new AnalyticsService();
