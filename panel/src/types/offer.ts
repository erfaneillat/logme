export type OfferUserType = 'all' | 'new' | 'old' | 'expired' | 'active_subscribers';
export type OfferType = 'percentage' | 'fixed_amount' | 'trial' | 'feature';

export interface OfferConditions {
    userRegisteredWithinDays?: number;
    userRegisteredAfterDays?: number;
    hasActiveSubscription?: boolean;
    hasExpiredSubscription?: boolean;
    minPurchaseAmount?: number;
}

export interface OfferDisplay {
    bannerText: string;
    bannerSubtext?: string;
    backgroundColor?: string;
    textColor?: string;
    badgeText?: string;
    icon?: string;
}

export interface OfferPlanPricing {
    planId: string;
    discountedPrice?: number;
    discountedPricePerMonth?: number;
}

export interface Offer {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    display: OfferDisplay;
    offerType: OfferType;
    discountPercentage?: number;
    discountAmount?: number;
    planPricing?: OfferPlanPricing[];
    cafebazaarProductKey?: string;
    startDate?: string;
    endDate?: string;
    isTimeLimited: boolean;
    targetUserType: OfferUserType;
    conditions: OfferConditions;
    applicablePlans: any[];
    applyToAllPlans: boolean;
    priority: number;
    isActive: boolean;
    usageCount: number;
    maxUsageLimit?: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateOfferRequest {
    name: string;
    slug: string;
    description?: string;
    display: OfferDisplay;
    offerType: OfferType;
    discountPercentage?: number;
    discountAmount?: number;
    planPricing?: OfferPlanPricing[];
    cafebazaarProductKey?: string;
    startDate?: string;
    endDate?: string;
    isTimeLimited: boolean;
    targetUserType: OfferUserType;
    conditions: OfferConditions;
    applicablePlans: string[];
    applyToAllPlans: boolean;
    priority: number;
    isActive: boolean;
    maxUsageLimit?: number;
}

export interface UpdateOfferRequest extends Partial<CreateOfferRequest> {}
