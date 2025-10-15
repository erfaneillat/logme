import mongoose, { Document, Schema } from 'mongoose';

export type OfferUserType = 'all' | 'new' | 'old' | 'expired' | 'active_subscribers';
export type OfferType = 'percentage' | 'fixed_amount' | 'trial' | 'feature';

export interface IOfferConditions {
    userRegisteredWithinDays?: number; // For new users (e.g., 1 day, 7 days)
    userRegisteredAfterDays?: number; // For old users (e.g., after 30 days)
    hasActiveSubscription?: boolean;
    hasExpiredSubscription?: boolean;
    minPurchaseAmount?: number;
}

export interface IOfferDisplay {
    bannerText: string; // Main display text (e.g., "70% OFF Special")
    bannerSubtext?: string; // Secondary text (e.g., "For new users only")
    backgroundColor?: string; // Hex color for banner
    textColor?: string; // Hex color for text
    badgeText?: string; // Badge label (e.g., "LIMITED TIME")
    icon?: string; // Icon name or emoji
}

export interface IOfferPlanPricing {
    planId: mongoose.Types.ObjectId;
    discountedPrice?: number; // Override price after discount
    discountedPricePerMonth?: number; // Override per-month price after discount
}

export interface IOffer extends Document {
    name: string; // Internal name (e.g., "Winter Sale 2024")
    slug: string; // URL-friendly identifier
    description?: string;
    
    // Display settings
    display: IOfferDisplay;
    
    // Offer type and value
    offerType: OfferType;
    discountPercentage?: number; // For percentage type
    discountAmount?: number; // For fixed amount type
    planPricing?: IOfferPlanPricing[]; // Per-plan pricing overrides
    
    // CafeBazaar integration
    cafebazaarProductKey?: string; // CafeBazaar product key for offers
    
    // Time settings
    startDate?: Date;
    endDate?: Date;
    isTimeLimited: boolean;
    
    // User targeting
    targetUserType: OfferUserType;
    conditions: IOfferConditions;
    
    // Plan assignment
    applicablePlans: mongoose.Types.ObjectId[]; // Reference to SubscriptionPlan
    applyToAllPlans: boolean;
    
    // Priority and status
    priority: number; // Higher number = higher priority
    isActive: boolean;
    
    // Usage tracking
    usageCount: number;
    maxUsageLimit?: number; // Optional limit on total uses
    
    // Metadata
    createdBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const offerSchema = new Schema<IOffer>(
    {
        name: {
            type: String,
            required: [true, 'Offer name is required'],
            trim: true,
        },
        slug: {
            type: String,
            required: [true, 'Offer slug is required'],
            unique: true,
            trim: true,
            lowercase: true,
        },
        description: {
            type: String,
            trim: true,
        },
        display: {
            bannerText: {
                type: String,
                required: [true, 'Banner text is required'],
            },
            bannerSubtext: String,
            backgroundColor: {
                type: String,
                default: '#E53935',
            },
            textColor: {
                type: String,
                default: '#FFFFFF',
            },
            badgeText: String,
            icon: String,
        },
        offerType: {
            type: String,
            enum: ['percentage', 'fixed_amount', 'trial', 'feature'],
            default: 'percentage',
        },
        discountPercentage: {
            type: Number,
            min: [0, 'Discount percentage cannot be negative'],
            max: [100, 'Discount percentage cannot exceed 100'],
        },
        discountAmount: {
            type: Number,
            min: [0, 'Discount amount cannot be negative'],
        },
        planPricing: [{
            planId: {
                type: Schema.Types.ObjectId,
                ref: 'SubscriptionPlan',
            },
            discountedPrice: Number,
            discountedPricePerMonth: Number,
        }],
        cafebazaarProductKey: {
            type: String,
            required: false,
            trim: true,
        },
        startDate: Date,
        endDate: Date,
        isTimeLimited: {
            type: Boolean,
            default: false,
        },
        targetUserType: {
            type: String,
            enum: ['all', 'new', 'old', 'expired', 'active_subscribers'],
            default: 'all',
        },
        conditions: {
            userRegisteredWithinDays: Number,
            userRegisteredAfterDays: Number,
            hasActiveSubscription: Boolean,
            hasExpiredSubscription: Boolean,
            minPurchaseAmount: Number,
        },
        applicablePlans: [{
            type: Schema.Types.ObjectId,
            ref: 'SubscriptionPlan',
        }],
        applyToAllPlans: {
            type: Boolean,
            default: false,
        },
        priority: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        usageCount: {
            type: Number,
            default: 0,
        },
        maxUsageLimit: Number,
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for better query performance
offerSchema.index({ slug: 1 });
offerSchema.index({ isActive: 1, priority: -1 });
offerSchema.index({ startDate: 1, endDate: 1 });
offerSchema.index({ targetUserType: 1 });

// Virtual to check if offer is currently valid
offerSchema.virtual('isCurrentlyValid').get(function() {
    if (!this.isActive) return false;
    
    if (this.isTimeLimited) {
        const now = new Date();
        if (this.startDate && now < this.startDate) return false;
        if (this.endDate && now > this.endDate) return false;
    }
    
    if (this.maxUsageLimit && this.usageCount >= this.maxUsageLimit) return false;
    
    return true;
});

// Method to check if offer applies to a specific user
offerSchema.methods.appliesTo = function(userCreatedAt: Date, hasActiveSubscription: boolean, hasExpiredSubscription: boolean): boolean {
    if (!this.isCurrentlyValid) return false;
    
    // Check target user type
    if (this.targetUserType === 'new' && this.conditions.userRegisteredWithinDays) {
        const daysSinceRegistration = Math.floor((Date.now() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceRegistration > this.conditions.userRegisteredWithinDays) return false;
    }
    
    if (this.targetUserType === 'old' && this.conditions.userRegisteredAfterDays) {
        const daysSinceRegistration = Math.floor((Date.now() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceRegistration < this.conditions.userRegisteredAfterDays) return false;
    }
    
    if (this.targetUserType === 'active_subscribers' && !hasActiveSubscription) return false;
    if (this.targetUserType === 'expired' && !hasExpiredSubscription) return false;
    
    // Check subscription conditions
    if (this.conditions.hasActiveSubscription !== undefined) {
        if (this.conditions.hasActiveSubscription !== hasActiveSubscription) return false;
    }
    
    if (this.conditions.hasExpiredSubscription !== undefined) {
        if (this.conditions.hasExpiredSubscription !== hasExpiredSubscription) return false;
    }
    
    return true;
};

const Offer = mongoose.model<IOffer>('Offer', offerSchema);

export default Offer;
