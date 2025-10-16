import { API_BASE_URL, API_TIMEOUT } from '../config/api';
import { authService } from './auth.service';
import { errorLogger } from './errorLogger.service';
import type { Subscription, PaginatedSubscriptionResponse } from '../types/subscription';

class SubscriptionService {
    private async fetchWithTimeout(url: string, options: RequestInit = {}) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

        try {
            const token = authService.getToken();
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token ? `Bearer ${token}` : '',
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

    async listAll(params: {
        page?: number;
        limit?: number;
        search?: string;
        planType?: 'monthly' | 'yearly' | '';
        isActive?: string;
        sort?: string;
    }): Promise<PaginatedSubscriptionResponse> {
        const query = new URLSearchParams();
        if (params.page) query.set('page', String(params.page));
        if (params.limit) query.set('limit', String(params.limit));
        if (params.search) query.set('search', params.search);
        if (params.planType) query.set('planType', params.planType);
        if (params.isActive !== undefined && params.isActive !== '') query.set('isActive', params.isActive);
        if (params.sort) query.set('sort', params.sort);

        const url = `${API_BASE_URL}/api/subscription/admin/all?${query.toString()}`;
        const res = await this.fetchWithTimeout(url);
        return res.json();
    }

    async cancel(subscriptionId: string): Promise<{ success: boolean; message?: string }> {
        const url = `${API_BASE_URL}/api/subscription/admin/${subscriptionId}/cancel`;
        const res = await this.fetchWithTimeout(url, {
            method: 'POST',
        });
        return res.json();
    }

    async extend(subscriptionId: string, days: number): Promise<{ success: boolean; message?: string; data?: { newExpiryDate: string } }> {
        const url = `${API_BASE_URL}/api/subscription/admin/${subscriptionId}/extend`;
        const res = await this.fetchWithTimeout(url, {
            method: 'POST',
            body: JSON.stringify({ days }),
        });
        return res.json();
    }

    async activate(userId: string, planType: 'monthly' | 'yearly', durationDays?: number): Promise<{ success: boolean; message?: string; data?: any }> {
        const url = `${API_BASE_URL}/api/subscription/admin/activate`;
        const res = await this.fetchWithTimeout(url, {
            method: 'POST',
            body: JSON.stringify({ userId, planType, durationDays }),
        });
        return res.json();
    }
}

export const subscriptionService = new SubscriptionService();
