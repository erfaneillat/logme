import { API_BASE_URL, API_TIMEOUT } from '../config/api';
import { SubscriptionPlan, CreatePlanInput, UpdatePlanInput } from '../types/subscriptionPlan';

interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: any[];
}

class SubscriptionPlanService {
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

    async getAllPlans(token: string, activeOnly: boolean = false): Promise<ApiResponse<{ plans: SubscriptionPlan[] }>> {
        try {
            const url = `${API_BASE_URL}/api/subscription-plans${activeOnly ? '?activeOnly=true' : ''}`;
            const response = await this.fetchWithTimeout(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Get all plans error:', error);
            return {
                success: false,
                message: 'Failed to fetch plans. Please try again.',
            };
        }
    }

    async getPlanById(token: string, id: string): Promise<ApiResponse<{ plan: SubscriptionPlan }>> {
        try {
            const response = await this.fetchWithTimeout(
                `${API_BASE_URL}/api/subscription-plans/${id}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Get plan by ID error:', error);
            return {
                success: false,
                message: 'Failed to fetch plan. Please try again.',
            };
        }
    }

    async createPlan(token: string, planData: CreatePlanInput): Promise<ApiResponse<{ plan: SubscriptionPlan }>> {
        try {
            const response = await this.fetchWithTimeout(
                `${API_BASE_URL}/api/subscription-plans`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(planData),
                }
            );

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Create plan error:', error);
            return {
                success: false,
                message: 'Failed to create plan. Please try again.',
            };
        }
    }

    async updatePlan(token: string, id: string, planData: UpdatePlanInput): Promise<ApiResponse<{ plan: SubscriptionPlan }>> {
        try {
            const response = await this.fetchWithTimeout(
                `${API_BASE_URL}/api/subscription-plans/${id}`,
                {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(planData),
                }
            );

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Update plan error:', error);
            return {
                success: false,
                message: 'Failed to update plan. Please try again.',
            };
        }
    }

    async updatePlanPrice(
        token: string,
        duration: 'monthly' | 'yearly',
        priceData: {
            title?: string;
            price?: number;
            originalPrice?: number;
            discountPercentage?: number;
            pricePerMonth?: number;
            cafebazaarProductKey?: string;
        }
    ): Promise<ApiResponse<{ plan: SubscriptionPlan }>> {
        try {
            const response = await this.fetchWithTimeout(
                `${API_BASE_URL}/api/subscription-plans/${duration}/price`,
                {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(priceData),
                }
            );

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Update plan price error:', error);
            return {
                success: false,
                message: 'Failed to update price. Please try again.',
            };
        }
    }

    async deletePlan(token: string, id: string): Promise<ApiResponse<{}>> {
        try {
            const response = await this.fetchWithTimeout(
                `${API_BASE_URL}/api/subscription-plans/${id}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Delete plan error:', error);
            return {
                success: false,
                message: 'Failed to delete plan. Please try again.',
            };
        }
    }

    async togglePlanStatus(token: string, id: string): Promise<ApiResponse<{ plan: SubscriptionPlan }>> {
        try {
            const response = await this.fetchWithTimeout(
                `${API_BASE_URL}/api/subscription-plans/${id}/toggle-status`,
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Toggle plan status error:', error);
            return {
                success: false,
                message: 'Failed to toggle plan status. Please try again.',
            };
        }
    }
}

export const subscriptionPlanService = new SubscriptionPlanService();

