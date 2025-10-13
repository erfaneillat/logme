export interface Subscription {
    _id: string;
    userId: {
        _id: string;
        phone: string;
        email?: string;
        name?: string;
        isPhoneVerified: boolean;
    } | string;
    user?: {
        _id: string;
        phone: string;
        email?: string;
        name?: string;
        isPhoneVerified: boolean;
    };
    planType: 'monthly' | 'yearly';
    productKey: string;
    purchaseToken: string;
    orderId: string;
    payload?: string;
    isActive: boolean;
    startDate: string;
    expiryDate: string;
    autoRenew: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PaginatedSubscriptionResponse {
    success: boolean;
    data: {
        items: Subscription[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
}
