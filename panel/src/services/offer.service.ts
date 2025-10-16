import { API_BASE_URL, API_TIMEOUT } from '../config/api';
import { Offer, CreateOfferRequest, UpdateOfferRequest } from '../types/offer';
import { errorLogger } from './errorLogger.service';

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: any[];
}

class OfferService {
    private readonly basePath = '/api/offers';

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

    async getAllOffers(token: string, activeOnly: boolean = false): Promise<ApiResponse<{ offers: Offer[] }>> {
        try {
            const response = await this.fetchWithTimeout(
                `${API_BASE_URL}${this.basePath}?activeOnly=${activeOnly}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            return await response.json();
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Failed to fetch offers',
            };
        }
    }

    async getOfferById(token: string, id: string): Promise<ApiResponse<{ offer: Offer }>> {
        try {
            const response = await this.fetchWithTimeout(`${API_BASE_URL}${this.basePath}/${id}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return await response.json();
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Failed to fetch offer',
            };
        }
    }

    async createOffer(token: string, offerData: CreateOfferRequest): Promise<ApiResponse<{ offer: Offer }>> {
        try {
            const response = await this.fetchWithTimeout(`${API_BASE_URL}${this.basePath}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(offerData),
            });
            return await response.json();
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Failed to create offer',
            };
        }
    }

    async updateOffer(token: string, id: string, offerData: UpdateOfferRequest): Promise<ApiResponse<{ offer: Offer }>> {
        try {
            const response = await this.fetchWithTimeout(`${API_BASE_URL}${this.basePath}/${id}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(offerData),
            });
            return await response.json();
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Failed to update offer',
            };
        }
    }

    async deleteOffer(token: string, id: string): Promise<ApiResponse<{}>> {
        try {
            const response = await this.fetchWithTimeout(`${API_BASE_URL}${this.basePath}/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return await response.json();
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Failed to delete offer',
            };
        }
    }

    async toggleOfferStatus(token: string, id: string): Promise<ApiResponse<{ offer: Offer }>> {
        try {
            const response = await this.fetchWithTimeout(`${API_BASE_URL}${this.basePath}/${id}/toggle`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return await response.json();
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Failed to toggle offer status',
            };
        }
    }
}

export const offerService = new OfferService();
