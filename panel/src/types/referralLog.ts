export interface ReferralLog {
    _id: string;
    referrerId: string;
    referredUserId: {
        _id: string;
        name?: string;
        phone: string;
        email?: string;
    };
    referralCode: string;
    eventType: 'code_submitted' | 'first_purchase' | 'subscription_purchase';
    reward: number;
    subscriptionPlanType?: 'monthly' | 'yearly' | 'threeMonth';
    createdAt: string;
    updatedAt: string;
}

export interface ReferralLogResponse {
    success: boolean;
    data: {
        logs: ReferralLog[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
}

