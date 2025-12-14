import { API_BASE_URL, API_TIMEOUT } from '../config/api';
import { errorLogger } from './errorLogger.service';

export interface DashboardStatistics {
    overview: {
        totalUsers: number;
        newUsersLast30Days: number;
        activeSubscriptions: number;
        totalSubscriptions: number;
        totalDailyLogs: number;
        usersCompletedInfo: number;
        usersWithPlans: number;
        avgLogsPerUser: number;
        recentLogsCount: number;
        conversionRate: number;
        totalImageAnalyses: number;
        totalTextAnalyses: number;
        totalTrainingSessions: number;
        platformDistribution?: {
            web: number;
            android: number;
            ios: number;
            unknown: number;
        };
    };
    subscriptions: {
        monthly: number;
        yearly: number;
        total: number;
    };
    recentUsers: Array<{
        _id: string;
        phone: string;
        name?: string;
        createdAt: string;
        isPhoneVerified: boolean;
    }>;
    recentSubscriptions: Array<{
        _id: string;
        userId: {
            _id: string;
            phone: string;
            name?: string;
        };
        planType: string;
        startDate: string;
        expiryDate: string;
        isActive: boolean;
    }>;
    subscriptionPlans: Array<{
        _id: string;
        name: string;
        price: number;
        duration: string;
        isActive: boolean;
    }>;
}

export interface UserGrowth {
    date: string;
    count: number;
}

export interface RevenueStatistics {
    estimatedMonthlyRevenue: number;
    estimatedYearlyRevenue: number;
    totalActiveSubscriptions: number;
}

class StatisticsService {
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

    async getDashboardStatistics(token: string): Promise<DashboardStatistics> {
        try {
            const response = await this.fetchWithTimeout(
                `${API_BASE_URL}/api/statistics/dashboard`,
                {
                    method: 'GET',
                    headers: this.getAuthHeaders(token),
                }
            );
            const data = await response.json();
            return data.data;
        } catch (error) {
            errorLogger.error('Error fetching dashboard statistics:', error);
            throw error;
        }
    }

    async getUserGrowth(token: string, days: number = 30): Promise<UserGrowth[]> {
        try {
            const response = await this.fetchWithTimeout(
                `${API_BASE_URL}/api/statistics/user-growth?days=${days}`,
                {
                    method: 'GET',
                    headers: this.getAuthHeaders(token),
                }
            );
            const data = await response.json();
            return data.data;
        } catch (error) {
            errorLogger.error('Error fetching user growth:', error);
            throw error;
        }
    }

    async getRevenueStatistics(token: string): Promise<RevenueStatistics> {
        try {
            const response = await this.fetchWithTimeout(
                `${API_BASE_URL}/api/statistics/revenue`,
                {
                    method: 'GET',
                    headers: this.getAuthHeaders(token),
                }
            );
            const data = await response.json();
            return data.data;
        } catch (error) {
            errorLogger.error('Error fetching revenue statistics:', error);
            throw error;
        }
    }
}

export const statisticsService = new StatisticsService();
