export const BASE_URL = process.env.NODE_ENV === 'development'
    ? 'http://localhost:9000'
    : 'https://loqmeapp.ir';

interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data: T;
    errors?: Record<string, any>;
}

export interface User {
    id: string;
    phone: string;
    name?: string;
    hasCompletedAdditionalInfo?: boolean;
    token?: string;
    [key: string]: any;
}

export const apiService = {
    sendCode: async (phone: string): Promise<ApiResponse> => {
        try {
            const response = await fetch(`${BASE_URL}/api/auth/send-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ phone }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to send code');
            }
            return data;
        } catch (error: any) {
            throw new Error(error.message || 'Network error');
        }
    },

    verifyCode: async (phone: string, verificationCode: string): Promise<User> => {
        try {
            const response = await fetch(`${BASE_URL}/api/auth/verify-phone`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ phone, verificationCode }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Verification failed');
            }

            const userData = data.data.user;
            const token = data.data.token;

            // Save token
            if (typeof window !== 'undefined' && token) {
                localStorage.setItem('auth_token', token);
            }

            return { ...userData, token };
        } catch (error: any) {
            throw new Error(error.message || 'Network error');
        }
    },

    saveAdditionalInfo: async (data: any): Promise<ApiResponse> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            const response = await fetch(`${BASE_URL}/api/user/additional-info`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            const responseData = await response.json();
            if (!response.ok) {
                throw new Error(responseData.message || responseData.error || 'Failed to save info');
            }
            return responseData;
        } catch (error: any) {
            throw new Error(error.message || 'Network error');
        }
    },

    markAdditionalInfoCompleted: async (): Promise<ApiResponse> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            const response = await fetch(`${BASE_URL}/api/user/mark-additional-info-completed`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const responseData = await response.json();
            if (!response.ok) {
                throw new Error(responseData.message || responseData.error || 'Failed to mark completion');
            }
            return responseData;
        } catch (error: any) {
            throw new Error(error.message || 'Network error');
        }
    }
};
