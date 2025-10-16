import { API_BASE_URL, API_TIMEOUT } from '../config/api';
import { errorLogger } from './errorLogger.service';

export interface LogItem {
    _id: string;
    userId: string;
    userName?: string;
    userPhone: string;
    date: string;
    type: 'image' | 'text';
    imageUrl?: string;
    title: string;
    calories: number;
    carbsGrams: number;
    proteinGrams: number;
    fatsGrams: number;
    healthScore?: number;
    portions?: number;
    ingredients?: Array<{
        name: string;
        calories: number;
        proteinGrams: number;
        fatGrams: number;
        carbsGrams: number;
    }>;
    timeIso: string;
    liked?: boolean;
    createdAt: string;
}

export interface LogsResponse {
    logs: LogItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface LogStats {
    totalLogs: number;
    totalItems: number;
    imageAnalyses: number;
    textAnalyses: number;
}

class LogsService {
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

    async getLogs(
        token: string,
        page: number = 1,
        limit: number = 20,
        type?: 'image' | 'text'
    ): Promise<LogsResponse> {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });
            
            if (type) {
                params.append('type', type);
            }

            const response = await this.fetchWithTimeout(
                `${API_BASE_URL}/api/admin/logs?${params.toString()}`,
                {
                    method: 'GET',
                    headers: this.getAuthHeaders(token),
                }
            );
            const data = await response.json();
            return data.data;
        } catch (error) {
            errorLogger.error('Error fetching logs:', error);
            throw error;
        }
    }

    async getLogStats(token: string): Promise<LogStats> {
        try {
            const response = await this.fetchWithTimeout(
                `${API_BASE_URL}/api/admin/logs/stats`,
                {
                    method: 'GET',
                    headers: this.getAuthHeaders(token),
                }
            );
            const data = await response.json();
            return data.data;
        } catch (error) {
            errorLogger.error('Error fetching log stats:', error);
            throw error;
        }
    }

    async searchLogs(
        token: string,
        searchTerm: string,
        page: number = 1,
        limit: number = 20
    ): Promise<LogsResponse> {
        try {
            const params = new URLSearchParams({
                q: searchTerm,
                page: page.toString(),
                limit: limit.toString(),
            });

            const response = await this.fetchWithTimeout(
                `${API_BASE_URL}/api/admin/logs/search?${params.toString()}`,
                {
                    method: 'GET',
                    headers: this.getAuthHeaders(token),
                }
            );
            const data = await response.json();
            return data.data;
        } catch (error) {
            errorLogger.error('Error searching logs:', error);
            throw error;
        }
    }

    async getUserLogs(
        token: string,
        userId: string,
        page: number = 1,
        limit: number = 20
    ): Promise<LogsResponse> {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            const response = await this.fetchWithTimeout(
                `${API_BASE_URL}/api/admin/logs/user/${userId}?${params.toString()}`,
                {
                    method: 'GET',
                    headers: this.getAuthHeaders(token),
                }
            );
            const data = await response.json();
            return data.data;
        } catch (error) {
            errorLogger.error('Error fetching user logs:', error);
            throw error;
        }
    }
}

export const logsService = new LogsService();
