import { API_BASE_URL, API_TIMEOUT } from '../config/api';
import { errorLogger } from './errorLogger.service';

export type NutritionChatSenderRole = 'user' | 'assistant';

export interface NutritionChatMessage {
    _id: string;
    userId: string;
    senderRole: NutritionChatSenderRole;
    message: string;
    imageUrl?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface NutritionChatHistoryResponse {
    items: NutritionChatMessage[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

class NutritionChatService {
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

    async getUserChatHistory(
        token: string,
        userId: string,
        page: number = 1,
        limit: number = 50,
    ): Promise<NutritionChatHistoryResponse> {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            const response = await this.fetchWithTimeout(
                `${API_BASE_URL}/api/chat/admin/nutrition/user/${userId}/history?${params.toString()}`,
                {
                    method: 'GET',
                    headers: this.getAuthHeaders(token),
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch nutrition chat history: ${response.statusText}`);
            }

            const data = await response.json();
            return data.data as NutritionChatHistoryResponse;
        } catch (error) {
            errorLogger.error('Error fetching nutrition chat history:', error, {
                component: 'NutritionChatService',
                action: 'getUserChatHistory',
            });
            throw error;
        }
    }
}

export const nutritionChatService = new NutritionChatService();
