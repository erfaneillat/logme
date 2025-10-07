import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscriptionPlan extends Document {
    name: string; // e.g., "Monthly Plan", "Yearly Plan"
    duration: 'monthly' | 'yearly';
    price: number; // Price in Toman
    originalPrice?: number; // Original price before discount (optional)
    discountPercentage?: number; // e.g., 60 for 60% off
    pricePerMonth?: number; // For yearly plans: price divided by 12
    cafebazaarProductKey?: string; // Cafebazaar product key for in-app purchases
    isActive: boolean; // Whether this plan is currently available
    features: string[]; // List of features included in the plan
    sortOrder: number; // For ordering plans in the UI
    createdAt: Date;
    updatedAt: Date;
}

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>(
    {
        name: {
            type: String,
            required: [true, 'Plan name is required'],
            trim: true,
        },
        duration: {
            type: String,
            required: [true, 'Duration is required'],
            enum: ['monthly', 'yearly'],
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative'],
        },
        originalPrice: {
            type: Number,
            required: false,
            min: [0, 'Original price cannot be negative'],
        },
        discountPercentage: {
            type: Number,
            required: false,
            min: [0, 'Discount percentage cannot be negative'],
            max: [100, 'Discount percentage cannot exceed 100'],
        },
        pricePerMonth: {
            type: Number,
            required: false,
            min: [0, 'Price per month cannot be negative'],
        },
        cafebazaarProductKey: {
            type: String,
            required: false,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        features: {
            type: [String],
            default: [],
        },
        sortOrder: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for better query performance
subscriptionPlanSchema.index({ duration: 1, isActive: 1 });
subscriptionPlanSchema.index({ sortOrder: 1 });

const SubscriptionPlan = mongoose.model<ISubscriptionPlan>(
    'SubscriptionPlan',
    subscriptionPlanSchema
);

export default SubscriptionPlan;

