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

// Types for Home Page data
export interface DailyLogItem {
    _id: string;
    title: string;
    calories: number;
    carbsGrams: number;
    proteinGrams: number;
    fatsGrams: number;
    portions: number;
    healthScore?: number;
    timeIso: string;
    imageUrl?: string;
    ingredients?: Array<{
        name: string;
        calories: number;
        proteinGrams: number;
        fatGrams: number;
        carbsGrams: number;
    }>;
    liked?: boolean;
}

export interface DailyLog {
    userId: string;
    date: string;
    caloriesConsumed: number;
    carbsGrams: number;
    proteinGrams: number;
    fatsGrams: number;
    burnedCalories: number;
    items: DailyLogItem[];
}

export interface Plan {
    calories: number;
    carbsGrams: number;
    proteinGrams: number;
    fatsGrams: number;
    healthScore?: number;
    dailyGoal?: string;
}

export interface UserProfile {
    id: string;
    phone: string;
    name?: string;
    streakCount: number;
    hasCompletedAdditionalInfo?: boolean;
    createdAt?: string;
}

export interface FoodIngredient {
    name: string;
    calories: number;
    proteinGrams: number;
    fatGrams: number;
    carbsGrams: number;
}

export interface FoodAnalysisResponse {
    title: string;
    calories: number;
    carbsGrams: number;
    proteinGrams: number;
    fatGrams: number;
    healthScore?: number;
    ingredients?: FoodIngredient[];
    isFood?: boolean;
    error?: string;
}

export interface LikedFood {
    title: string;
    calories: number;
    carbsGrams: number;
    proteinGrams: number;
    fatsGrams: number;
    portions: number;
    healthScore?: number;
    imageUrl?: string;
    ingredients?: FoodIngredient[];
    timeIso: string;
    date: string;
}

export const apiService = {
    // Home Page APIs
    getDailyLog: async (date: string): Promise<DailyLog> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            const response = await fetch(`${BASE_URL}/api/logs?date=${date}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to fetch daily log');
            }

            const log = data.data?.log || data.log || {
                userId: '',
                date: date,
                caloriesConsumed: 0,
                carbsGrams: 0,
                proteinGrams: 0,
                fatsGrams: 0,
                burnedCalories: 0,
                items: [],
            };

            return log;
        } catch (error: any) {
            console.error('getDailyLog error:', error);
            // Return empty log on error
            return {
                userId: '',
                date: date,
                caloriesConsumed: 0,
                carbsGrams: 0,
                proteinGrams: 0,
                fatsGrams: 0,
                burnedCalories: 0,
                items: [],
            };
        }
    },

    getLatestPlan: async (): Promise<Plan> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            const response = await fetch(`${BASE_URL}/api/plan/latest`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to fetch plan');
            }

            const plan = data.data || data;
            return {
                calories: plan.calories || 2200,
                carbsGrams: plan.carbsGrams || 250,
                proteinGrams: plan.proteinGrams || 150,
                fatsGrams: plan.fatsGrams || 70,
                healthScore: plan.healthScore,
                dailyGoal: plan.dailyGoal,
            };
        } catch (error: any) {
            console.error('getLatestPlan error:', error);
            // Return default plan on error
            return {
                calories: 2200,
                carbsGrams: 250,
                proteinGrams: 150,
                fatsGrams: 70,
            };
        }
    },

    getUserProfile: async (): Promise<UserProfile | null> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            const response = await fetch(`${BASE_URL}/api/auth/profile`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to fetch profile');
            }

            const user = data.data?.user || data.user || data.data || data;
            return {
                id: user._id || user.id || '',
                phone: user.phone || '',
                name: user.name,
                streakCount: user.streakCount || 0,
                hasCompletedAdditionalInfo: user.hasCompletedAdditionalInfo,
                createdAt: user.createdAt,
            };
        } catch (error: any) {
            console.error('getUserProfile error:', error);
            return null;
        }
    },

    getStreakCompletions: async (): Promise<string[]> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            // Calculate last 7 days range
            const today = new Date();
            const endDate = new Date(today);
            const startDate = new Date(today);
            startDate.setDate(today.getDate() - 6); // 7 days including today

            const formatDate = (d: Date) => {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const start = formatDate(startDate);
            const end = formatDate(endDate);

            const response = await fetch(`${BASE_URL}/api/streak/completions?start=${start}&end=${end}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to fetch streak completions');
            }

            // Return array of YYYY-MM-DD dates
            return data.data?.dates || data.dates || [];
        } catch (error: any) {
            console.error('getStreakCompletions error:', error);
            return [];
        }
    },

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
                let errorMessage = responseData.message || responseData.error || 'Failed to save info';
                if (responseData.errors && Array.isArray(responseData.errors)) {
                    const fields = responseData.errors.map((e: any) => e.path || e.param).join(', ');
                    errorMessage += `: ${fields}`;
                }
                throw new Error(errorMessage);
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
    },

    // Food Analysis APIs (matching Flutter implementation)
    analyzeFoodImage: async (imageFile: File, date?: string): Promise<FoodAnalysisResponse> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            const formData = new FormData();
            formData.append('image', imageFile);
            if (date) {
                formData.append('date', date);
            }

            const response = await fetch(`${BASE_URL}/api/food/analyze`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept-Language': 'fa',
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle free tier limit
                if (response.status === 429 && data.error === 'free_tier_limit_reached') {
                    throw new Error(data.messageFa || data.message || 'محدودیت روزانه به پایان رسید');
                }
                throw new Error(data.error || data.message || 'خطا در تحلیل تصویر');
            }

            return data.data;
        } catch (error: any) {
            console.error('analyzeFoodImage error:', error);
            throw error;
        }
    },

    analyzeFoodText: async (description: string, date?: string): Promise<FoodAnalysisResponse> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            const body: { description: string; date?: string } = { description };
            if (date) {
                body.date = date;
            }

            const response = await fetch(`${BASE_URL}/api/food/analyze-description`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept-Language': 'fa',
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle free tier limit
                if (response.status === 429 && data.error === 'free_tier_limit_reached') {
                    throw new Error(data.messageFa || data.message || 'محدودیت روزانه به پایان رسید');
                }
                throw new Error(data.error || data.message || 'خطا در تحلیل متن');
            }

            return data.data;
        } catch (error: any) {
            console.error('analyzeFoodText error:', error);
            throw error;
        }
    },

    updateLogItem: async (itemId: string, data: any): Promise<DailyLogItem> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            const response = await fetch(`${BASE_URL}/api/logs/item/${itemId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || responseData.error || 'Failed to update item');
            }

            return responseData.data;
        } catch (error: any) {
            console.error('updateLogItem error:', error);
            throw error;
        }
    },

    deleteLogItem: async (itemId: string, date: string): Promise<void> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            const response = await fetch(`${BASE_URL}/api/logs/item/${itemId}?date=${date}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || responseData.error || 'Failed to delete item');
            }
        } catch (error: any) {
            console.error('deleteLogItem error:', error);
            throw error;
        }
    },

    addItem: async (item: any): Promise<DailyLogItem> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            const response = await fetch(`${BASE_URL}/api/logs/item`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(item),
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || responseData.error || 'Failed to add item');
            }

            return responseData.data?.item || responseData.data;
        } catch (error: any) {
            console.error('addItem error:', error);
            throw error;
        }
    },

    getLikedFoods: async (): Promise<LikedFood[]> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            const response = await fetch(`${BASE_URL}/api/logs/liked`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to fetch liked foods');
            }

            return data.data?.items || [];
        } catch (error: any) {
            console.error('getLikedFoods error:', error);
            return [];
        }
    },

    fixResult: async (originalData: any, userDescription: string): Promise<any> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            const response = await fetch(`${BASE_URL}/api/food/fix-result`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ originalData, userDescription }),
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || responseData.error || 'Failed to fix result');
            }

            return responseData.data;
        } catch (error: any) {
            console.error('fixResult error:', error);
            throw error;
        }
    },
};
