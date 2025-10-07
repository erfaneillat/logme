export interface SubscriptionPlan {
    _id: string;
    name: string;
    duration: 'monthly' | 'yearly';
    price: number;
    originalPrice?: number;
    discountPercentage?: number;
    pricePerMonth?: number;
    cafebazaarProductKey?: string;
    isActive: boolean;
    features: string[];
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePlanInput {
    name: string;
    duration: 'monthly' | 'yearly';
    price: number;
    originalPrice?: number;
    discountPercentage?: number;
    pricePerMonth?: number;
    cafebazaarProductKey?: string;
    isActive?: boolean;
    features?: string[];
    sortOrder?: number;
}

export interface UpdatePlanInput extends Partial<CreatePlanInput> { }

