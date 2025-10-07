import { API_BASE_URL, API_ENDPOINTS, API_TIMEOUT } from '../config/api';

export interface SendCodeResponse {
    success: boolean;
    message: string;
    data?: {
        phone: string;
    };
}

export interface AdminUser {
    id: string;
    phone: string;
    name?: string;
    email?: string;
    isPhoneVerified: boolean;
    isAdmin: boolean;
}

export interface VerifyPhoneResponse {
    success: boolean;
    message: string;
    data?: {
        token: string;
        user: AdminUser;
    };
}

class AuthService {
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

    async sendVerificationCode(phone: string): Promise<SendCodeResponse> {
        try {
            const response = await this.fetchWithTimeout(
                `${API_BASE_URL}${API_ENDPOINTS.AUTH.SEND_CODE}`,
                {
                    method: 'POST',
                    body: JSON.stringify({ phone }),
                }
            );

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Send verification code error:', error);
            return {
                success: false,
                message: 'Failed to send verification code. Please try again.',
            };
        }
    }

    async verifyAdminPhone(
        phone: string,
        verificationCode: string
    ): Promise<VerifyPhoneResponse> {
        try {
            const response = await this.fetchWithTimeout(
                `${API_BASE_URL}${API_ENDPOINTS.AUTH.VERIFY_ADMIN_PHONE}`,
                {
                    method: 'POST',
                    body: JSON.stringify({ phone, verificationCode }),
                }
            );

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Verify admin phone error:', error);
            return {
                success: false,
                message: 'Failed to verify phone. Please try again.',
            };
        }
    }

    async getProfile(token: string): Promise<{ success: boolean; data?: { user: AdminUser } }> {
        try {
            const response = await this.fetchWithTimeout(
                `${API_BASE_URL}${API_ENDPOINTS.AUTH.PROFILE}`,
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
            console.error('Get profile error:', error);
            return {
                success: false,
            };
        }
    }

    // Token management
    saveToken(token: string): void {
        localStorage.setItem('admin_token', token);
    }

    getToken(): string | null {
        return localStorage.getItem('admin_token');
    }

    removeToken(): void {
        localStorage.removeItem('admin_token');
    }

    // User management
    saveUser(user: AdminUser): void {
        localStorage.setItem('admin_user', JSON.stringify(user));
    }

    getUser(): AdminUser | null {
        const userStr = localStorage.getItem('admin_user');
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    }

    removeUser(): void {
        localStorage.removeItem('admin_user');
    }

    logout(): void {
        this.removeToken();
        this.removeUser();
    }
}

export const authService = new AuthService();

