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

export interface CreatePlanInput {
    name: string;
    title?: string;
    duration: 'monthly' | '3month' | 'yearly';
    price: number;
    originalPrice?: number | null;
    discountPercentage?: number | null;
    pricePerMonth?: number | null;
    cafebazaarProductKey?: string;
    imageUrl?: string;
    isActive?: boolean;
    features?: string[];
    sortOrder?: number;
}

export interface UpdatePlanInput extends Partial<CreatePlanInput> { }

