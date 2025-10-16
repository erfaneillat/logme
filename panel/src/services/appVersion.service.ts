import { API_BASE_URL, API_TIMEOUT } from '../config/api';
import { AppVersion, CreateAppVersionRequest, UpdateAppVersionRequest } from '../types/appVersion';

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: any[];
}

class AppVersionService {
    private readonly basePath = '/api/app-version';

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

    async getAllAppVersions(token: string): Promise<ApiResponse<AppVersion[]>> {
        try {
            const response = await this.fetchWithTimeout(
                `${API_BASE_URL}${this.basePath}`,
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
                message: error.message || 'Failed to fetch app versions',
            };
        }
    }

    async getAppVersionById(token: string, id: string): Promise<ApiResponse<AppVersion>> {
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
                message: error.message || 'Failed to fetch app version',
            };
        }
    }

    async createAppVersion(token: string, versionData: CreateAppVersionRequest): Promise<ApiResponse<AppVersion>> {
        try {
            const response = await this.fetchWithTimeout(`${API_BASE_URL}${this.basePath}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(versionData),
            });
            return await response.json();
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Failed to create app version',
            };
        }
    }

    async updateAppVersion(token: string, id: string, versionData: UpdateAppVersionRequest): Promise<ApiResponse<AppVersion>> {
        try {
            const response = await this.fetchWithTimeout(`${API_BASE_URL}${this.basePath}/${id}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(versionData),
            });
            return await response.json();
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Failed to update app version',
            };
        }
    }

    async deleteAppVersion(token: string, id: string): Promise<ApiResponse<{}>> {
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
                message: error.message || 'Failed to delete app version',
            };
        }
    }

    async toggleAppVersionActive(token: string, id: string): Promise<ApiResponse<AppVersion>> {
        try {
            const response = await this.fetchWithTimeout(`${API_BASE_URL}${this.basePath}/${id}/toggle-active`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return await response.json();
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Failed to toggle app version active status',
            };
        }
    }
}

export const appVersionService = new AppVersionService();
