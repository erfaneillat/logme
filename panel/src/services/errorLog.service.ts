import { API_BASE_URL, API_TIMEOUT } from '../config/api';
import { errorLogger } from './errorLogger.service';

export interface ErrorLogItem {
    _id: string;
    level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
    message: string;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
    context?: {
        controller?: string;
        action?: string;
        service?: string;
        method?: string;
        component?: string;
        [key: string]: any;
    };
    request?: {
        method: string;
        url: string;
        ip?: string;
        userAgent?: string;
    };
    metadata?: Record<string, any>;
    timestamp: string;
    createdAt: string;
}

export interface ErrorLogsResponse {
    logs: ErrorLogItem[];
    level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
    date: string;
    count: number;
}

export interface ErrorLogStats {
    total: number;
    byLevel: {
        INFO: number;
        WARNING: number;
        ERROR: number;
        CRITICAL: number;
    };
    last24Hours: number;
    last7Days: number;
}

class ErrorLogService {
    private async fetchWithTimeout(url: string, options: RequestInit = {}) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

        try {
            const response = await fetch(url, {
                // Avoid cache to prevent 304 responses with empty bodies
                cache: 'no-store',
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                    Pragma: 'no-cache',
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

    async getErrorLogs(
        token: string,
        page: number = 1,
        limit: number = 50,
        level?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL',
        date?: string
    ): Promise<ErrorLogsResponse> {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });
            
            if (level) {
                params.append('level', level);
            }
            
            if (date) {
                params.append('date', date);
            }

            const response = await this.fetchWithTimeout(
                `${API_BASE_URL}/api/error-logs?${params.toString()}`,
                {
                    method: 'GET',
                    headers: this.getAuthHeaders(token),
                }
            );
            
            if (!response.ok) {
                throw new Error(`Failed to fetch error logs: ${response.statusText}`);
            }
            
            const data = await response.json();
            // Server shape: { success, data: { logs, level, date, count } }
            return data.data as ErrorLogsResponse;
        } catch (error) {
            errorLogger.error('Error fetching error logs:', error, { component: 'ErrorLogService', action: 'getErrorLogs' });
            throw error;
        }
    }

    async getErrorLogStats(token: string): Promise<ErrorLogStats> {
        try {
            const response = await this.fetchWithTimeout(
                `${API_BASE_URL}/api/error-logs/stats`,
                {
                    method: 'GET',
                    headers: this.getAuthHeaders(token),
                }
            );
            
            if (!response.ok) {
                throw new Error(`Failed to fetch error log stats: ${response.statusText}`);
            }
            
            const data = await response.json();
            // Server shape: { success, data: { stats, date } }
            // stats is a record of level -> count. We normalize it to ErrorLogStats
            const statsRecord = (data?.data?.stats || {}) as Record<string, number>;
            const byLevel = {
                INFO: statsRecord.INFO ?? 0,
                WARNING: statsRecord.WARNING ?? 0,
                ERROR: statsRecord.ERROR ?? 0,
                CRITICAL: statsRecord.CRITICAL ?? 0,
            } as ErrorLogStats['byLevel'];

            const total = Object.values(byLevel).reduce((sum, n) => sum + n, 0);

            const normalized: ErrorLogStats = {
                total,
                byLevel,
                // Server currently returns counts for the current day; use that as last24Hours
                last24Hours: total,
                // Not provided by server; set to 0 for now
                last7Days: 0,
            };

            return normalized;
        } catch (error) {
            errorLogger.error('Error fetching error log stats:', error, { component: 'ErrorLogService', action: 'getErrorLogStats' });
            throw error;
        }
    }
}

export const errorLogService = new ErrorLogService();
