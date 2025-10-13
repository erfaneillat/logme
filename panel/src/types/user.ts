export interface User {
  _id: string;
  phone: string;
  email?: string;
  name?: string;
  isPhoneVerified: boolean;
  isAdmin?: boolean;
  hasCompletedAdditionalInfo: boolean;
  hasGeneratedPlan: boolean;
  aiCostUsdTotal?: number;
  referralCode?: string;
  referredBy?: string | null;
  referralSuccessCount?: number;
  referralEarnings?: number;
  streakCount?: number;
  lastStreakDate?: string | null;
  lastActivity?: string | null;
  addBurnedCalories?: boolean;
  rolloverCalories?: boolean;
  hasActiveSubscription?: boolean;
  logCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }
  }
}
