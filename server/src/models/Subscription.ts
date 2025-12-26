import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscription extends Document {
    userId: mongoose.Types.ObjectId;
    planType: 'monthly' | 'yearly' | 'threeMonth';
    productKey: string;
    purchaseToken: string;
    orderId: string;
    payload: string;
    isActive: boolean;
    startDate: Date;
    expiryDate: Date;
    autoRenew: boolean;
    rcAppUserId?: string; // RevenueCat's app_user_id for webhook matching
    createdAt: Date;
    updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },
        planType: {
            type: String,
            required: [true, 'Plan type is required'],
            enum: ['monthly', 'yearly', 'threeMonth'],
        },
        productKey: {
            type: String,
            required: [true, 'Product key is required'],
        },
        purchaseToken: {
            type: String,
            required: [true, 'Purchase token is required'],
            // Removed unique constraint to allow multiple subscriptions with same token
            // (e.g., for testing, renewals, reactivations)
        },
        orderId: {
            type: String,
            required: [true, 'Order ID is required'],
        },
        payload: {
            type: String,
            required: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        startDate: {
            type: Date,
            required: [true, 'Start date is required'],
            default: Date.now,
        },
        expiryDate: {
            type: Date,
            required: [true, 'Expiry date is required'],
        },
        autoRenew: {
            type: Boolean,
            default: true,
        },
        rcAppUserId: {
            type: String,
            required: false,
            index: true, // Index for fast webhook lookups
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for better query performance
subscriptionSchema.index({ userId: 1, isActive: 1 });
subscriptionSchema.index({ expiryDate: 1 });
subscriptionSchema.index({ purchaseToken: 1 });
subscriptionSchema.index({ rcAppUserId: 1 });

const Subscription = mongoose.model<ISubscription>('Subscription', subscriptionSchema);

export default Subscription;

