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

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'general' | 'other';

export interface TicketMessage {
    _id?: string;
    senderId: string;
    senderName: string;
    senderRole: 'user' | 'admin';
    message: string;
    attachments?: string[];
    createdAt: string;
}

export interface Ticket {
    _id: string;
    userId: string;
    userName: string;
    userPhone: string;
    subject: string;
    category: TicketCategory;
    priority: TicketPriority;
    status: TicketStatus;
    messages: TicketMessage[];
    assignedTo?: string;
    assignedToName?: string;
    lastMessageAt: string;
    resolvedAt?: string;
    closedAt?: string;
    createdAt: string;
    updatedAt: string;
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

export interface ExerciseAnalysisResponse {
    activityName: string;
    caloriesBurned: number;
    duration: number;
    intensity: string;
    tips: string[];
}

export interface WeightEntry {
    _id?: string;
    userId: string;
    date: string;
    weightKg: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface AdditionalInfo {
    userId: string;
    gender?: string;
    birthDate?: string;
    age?: number;
    weight?: number;
    height?: number;
    activityLevel?: string;
    weightGoal?: string;
    workoutFrequency?: string;
    targetWeight?: number;
    weightLossSpeed?: number;
    diet?: string;
    accomplishment?: string;
}

export interface SubscriptionPlan {
    _id: string;
    name: string;
    title?: string;
    duration: 'monthly' | '3month' | 'yearly';
    price: number;
    originalPrice?: number;
    discountPercentage?: number;
    pricePerMonth?: number;
    cafebazaarProductKey?: string;
    imageUrl?: string;
    isActive: boolean;
    features: string[];
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface SubscriptionStatus {
    isActive: boolean;
    planType?: 'monthly' | 'yearly' | 'threeMonth' | null;
    expiryDate?: string | null;
    startDate?: string | null;
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

            const plan = data.data?.plan || data.plan || data.data || data;
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

    updatePlanManual: async (macros: { calories?: number; proteinGrams?: number; carbsGrams?: number; fatsGrams?: number }): Promise<Plan | null> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            const response = await fetch(`${BASE_URL}/api/plan/manual`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(macros),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to update plan');
            }

            const plan = data.data?.plan || data.plan || data.data;
            return {
                calories: plan.calories || 2200,
                carbsGrams: plan.carbsGrams || 250,
                proteinGrams: plan.proteinGrams || 150,
                fatsGrams: plan.fatsGrams || 70,
                healthScore: plan.healthScore,
                dailyGoal: plan.dailyGoal,
            };
        } catch (error: any) {
            console.error('updatePlanManual error:', error);
            throw error;
        }
    },

    generatePlan: async (): Promise<Plan | null> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            const response = await fetch(`${BASE_URL}/api/plan/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (!response.ok) {
                // Check for free tier limit error
                if (response.status === 429 && data.error === 'free_tier_limit_reached') {
                    throw new Error(data.messageFa || data.message || 'محدودیت روزانه به پایان رسید');
                }
                throw new Error(data.message || data.error || 'Failed to generate plan');
            }

            const plan = data.data?.plan || data.plan || data.data;
            return {
                calories: plan.calories || 2200,
                carbsGrams: plan.carbsGrams || 250,
                proteinGrams: plan.proteinGrams || 150,
                fatsGrams: plan.fatsGrams || 70,
                healthScore: plan.healthScore,
                dailyGoal: plan.dailyGoal,
            };
        } catch (error: any) {
            console.error('generatePlan error:', error);
            throw error;
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

    // Exercise APIs
    analyzeExercise: async (exercise: string, duration: number): Promise<ExerciseAnalysisResponse> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            const response = await fetch(`${BASE_URL}/api/logs/analyze-exercise`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ exercise, duration }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'خطا در تحلیل ورزش');
            }

            return data.data;
        } catch (error: any) {
            console.error('analyzeExercise error:', error);
            throw error;
        }
    },

    updateBurnedCalories: async (date: string, burnedCalories: number): Promise<{ preferenceEnabled: boolean }> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            const response = await fetch(`${BASE_URL}/api/logs/burned-calories`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ date, burnedCalories }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'خطا در ثبت کالری سوزانده شده');
            }

            return {
                preferenceEnabled: data.data?.preferenceEnabled ?? true,
            };
        } catch (error: any) {
            console.error('updateBurnedCalories error:', error);
            throw error;
        }
    },

    // Weight Tracking APIs
    getLatestWeight: async (): Promise<WeightEntry | null> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            const response = await fetch(`${BASE_URL}/api/weight/latest`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to fetch latest weight');
            }

            return data.data?.latest || null;
        } catch (error: any) {
            console.error('getLatestWeight error:', error);
            return null;
        }
    },

    getWeightRange: async (start: string, end: string): Promise<WeightEntry[]> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            const response = await fetch(`${BASE_URL}/api/weight/range?start=${start}&end=${end}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to fetch weight range');
            }

            return data.data?.entries || [];
        } catch (error: any) {
            console.error('getWeightRange error:', error);
            return [];
        }
    },

    upsertWeight: async (date: string, weightKg: number): Promise<WeightEntry | null> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            const response = await fetch(`${BASE_URL}/api/weight`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ date, weightKg }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to save weight');
            }

            return data.data?.entry || null;
        } catch (error: any) {
            console.error('upsertWeight error:', error);
            throw error;
        }
    },

    // Logs Range API (for weekly/monthly nutrition data)
    getLogsRange: async (start: string, end: string): Promise<DailyLog[]> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            const response = await fetch(`${BASE_URL}/api/logs/range?start=${start}&end=${end}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to fetch logs range');
            }

            return data.data?.logs || [];
        } catch (error: any) {
            console.error('getLogsRange error:', error);
            return [];
        }
    },

    // Additional Info API (for target weight, height, etc.)
    getAdditionalInfo: async (): Promise<AdditionalInfo | null> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            const response = await fetch(`${BASE_URL}/api/user/additional-info`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to fetch additional info');
            }

            return data.data?.additionalInfo || null;
        } catch (error: any) {
            console.error('getAdditionalInfo error:', error);
            return null;
        }
    },

    updateAdditionalInfo: async (updates: Partial<AdditionalInfo>): Promise<AdditionalInfo | null> => {
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
                body: JSON.stringify(updates),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to update additional info');
            }

            return data.data?.additionalInfo || null;
        } catch (error: any) {
            console.error('updateAdditionalInfo error:', error);
            throw error;
        }
    },

    // Chat APIs (matching Flutter implementation)
    sendChatMessage: async (message: string, imageUrl?: string): Promise<string> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            const body: { message: string; imageUrl?: string } = { message };
            if (imageUrl) {
                body.imageUrl = imageUrl;
            }

            const response = await fetch(`${BASE_URL}/api/chat/nutrition`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 403 && data.code === 'DAILY_MESSAGE_LIMIT_REACHED') {
                    throw new Error('DAILY_MESSAGE_LIMIT_REACHED');
                }
                throw new Error(data.message || data.error || 'Failed to send chat message');
            }

            return data.data?.reply || '';
        } catch (error: any) {
            console.error('sendChatMessage error:', error);
            throw error;
        }
    },

    streamChatMessage: async (
        message: string,
        imageUrl?: string,
        onToken?: (token: string) => void,
        onComplete?: (fullText: string) => void,
        onError?: (error: string) => void
    ): Promise<void> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            const body: { message: string; stream: boolean; imageUrl?: string } = {
                message,
                stream: true,
            };
            if (imageUrl) {
                body.imageUrl = imageUrl;
            }

            const response = await fetch(`${BASE_URL}/api/chat/nutrition?stream=1`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (response.status === 403 && errorData.code === 'DAILY_MESSAGE_LIMIT_REACHED') {
                    onError?.('DAILY_MESSAGE_LIMIT_REACHED');
                    return;
                }
                throw new Error(errorData.message || errorData.error || 'Failed to stream chat message');
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No response body reader available');
            }

            const decoder = new TextDecoder();
            let fullText = '';
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line in buffer

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.slice(6);
                        if (!jsonStr.trim()) continue;

                        try {
                            const event = JSON.parse(jsonStr);

                            // Check for errors in stream
                            if (event.error || event.code === 'DAILY_MESSAGE_LIMIT_REACHED') {
                                onError?.(event.code || event.error || 'Stream error');
                                return;
                            }

                            // Handle token streaming
                            if (event.token) {
                                fullText += event.token;
                                onToken?.(event.token);
                            }

                            // Handle completion
                            if (event.done) {
                                const finalText = event.full || fullText;
                                onComplete?.(finalText);
                                return;
                            }
                        } catch (e) {
                            // Ignore malformed JSON lines
                            console.warn('Failed to parse SSE line:', jsonStr);
                        }
                    }
                }
            }

            // If we exit the loop without done event, call onComplete with what we have
            if (fullText) {
                onComplete?.(fullText);
            }
        } catch (error: any) {
            console.error('streamChatMessage error:', error);
            onError?.(error.message || 'Stream error');
            throw error;
        }
    },

    uploadChatImage: async (imageFile: File): Promise<string> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            const formData = new FormData();
            formData.append('image', imageFile);

            const response = await fetch(`${BASE_URL}/api/chat/nutrition/image`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to upload chat image');
            }

            return data.data?.imageUrl || '';
        } catch (error: any) {
            console.error('uploadChatImage error:', error);
            throw error;
        }
    },

    getNutritionChatHistory: async (before?: string, limit: number = 30): Promise<{
        items: Array<{
            _id: string;
            message: string;
            senderRole: 'user' | 'assistant';
            createdAt: string;
            imageUrl?: string;
        }>;
        hasMore: boolean;
        nextCursor: string | null;
    }> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            let url = `${BASE_URL}/api/chat/nutrition/history?limit=${limit}`;
            if (before) {
                url += `&before=${before}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to fetch chat history');
            }

            const items = data.data?.items || [];
            const pagination = data.data?.pagination || {};

            return {
                items,
                hasMore: pagination.hasMore ?? false,
                nextCursor: pagination.nextCursor ?? null,
            };
        } catch (error: any) {
            console.error('getNutritionChatHistory error:', error);
            return { items: [], hasMore: false, nextCursor: null };
        }
    },

    // Profile Update API
    updateProfile: async (name?: string, email?: string): Promise<UserProfile | null> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            const body: { name?: string; email?: string } = {};
            if (name !== undefined) body.name = name;
            if (email !== undefined) body.email = email;

            const response = await fetch(`${BASE_URL}/api/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to update profile');
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
            console.error('updateProfile error:', error);
            throw error;
        }
    },

    // User Preferences APIs
    getPreferences: async (): Promise<{ addBurnedCalories: boolean; rolloverCalories: boolean }> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            const response = await fetch(`${BASE_URL}/api/preferences`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to fetch preferences');
            }

            return {
                addBurnedCalories: data.data?.addBurnedCalories ?? true,
                rolloverCalories: data.data?.rolloverCalories ?? true,
            };
        } catch (error: any) {
            console.error('getPreferences error:', error);
            return { addBurnedCalories: true, rolloverCalories: true };
        }
    },

    deleteAccount: async (reason?: string): Promise<boolean> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            const response = await fetch(`${BASE_URL}/api/auth/account`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ reason }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete account');
            }

            return true;
        } catch (error: any) {
            console.error('deleteAccount error:', error);
            throw error;
        }
    },

    updatePreferences: async (preferences: { addBurnedCalories?: boolean; rolloverCalories?: boolean }): Promise<{ addBurnedCalories: boolean; rolloverCalories: boolean }> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            const response = await fetch(`${BASE_URL}/api/preferences`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(preferences),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to update preferences');
            }

            return {
                addBurnedCalories: data.data?.addBurnedCalories ?? true,
                rolloverCalories: data.data?.rolloverCalories ?? true,
            };
        } catch (error: any) {
            console.error('updatePreferences error:', error);
            throw error;
        }
    },

    // Support Ticket APIs
    uploadTicketImage: async (file: File): Promise<string> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch(`${BASE_URL}/api/tickets/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to upload image');
            }

            return data.data?.url || data.url;
        } catch (error: any) {
            console.error('uploadTicketImage error:', error);
            throw error;
        }
    },

    createTicket: async (subject: string, message: string, category: TicketCategory = 'general', priority: TicketPriority = 'medium', attachments: string[] = []): Promise<Ticket> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            const response = await fetch(`${BASE_URL}/api/tickets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ subject, message, category, priority, attachments }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to create ticket');
            }

            return data.data?.ticket || data.ticket || data.data;
        } catch (error: any) {
            console.error('createTicket error:', error);
            throw error;
        }
    },

    getMyTickets: async (page: number = 1, limit: number = 20, status?: TicketStatus): Promise<Ticket[]> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });
            if (status) params.append('status', status);

            const response = await fetch(`${BASE_URL}/api/tickets/my-tickets?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to fetch tickets');
            }

            return data.data?.items || [];
        } catch (error: any) {
            console.error('getMyTickets error:', error);
            return [];
        }
    },

    getTicketById: async (ticketId: string): Promise<Ticket> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            const response = await fetch(`${BASE_URL}/api/tickets/${ticketId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to fetch ticket');
            }

            return data.data?.ticket || data.ticket || data.data;
        } catch (error: any) {
            console.error('getTicketById error:', error);
            throw error;
        }
    },

    replyToTicket: async (ticketId: string, message: string, attachments: string[] = []): Promise<Ticket> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            const response = await fetch(`${BASE_URL}/api/tickets/${ticketId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ message, attachments }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to reply to ticket');
            }

            return data.data?.ticket || data.ticket || data.data;
        } catch (error: any) {
            console.error('replyToTicket error:', error);
            throw error;
        }
    },

    // Subscription Plan APIs
    getSubscriptionPlans: async (): Promise<SubscriptionPlan[]> => {
        try {
            const response = await fetch(`${BASE_URL}/api/subscription-plans?activeOnly=true`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to fetch subscription plans');
            }

            return data.data?.plans || [];
        } catch (error: any) {
            console.error('getSubscriptionPlans error:', error);
            return [];
        }
    },

    getSubscriptionStatus: async (): Promise<SubscriptionStatus | null> => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
            if (!token) throw new Error('No auth token found');

            const response = await fetch(`${BASE_URL}/api/subscription/status`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to fetch subscription status');
            }

            return data.data || null;
        } catch (error: any) {
            console.error('getSubscriptionStatus error:', error);
            return null;
        }
    },
};
