import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscription extends Document {
    userId: mongoose.Types.ObjectId;
    planType: 'monthly' | 'yearly';
    productKey: string;
    purchaseToken: string;
    orderId: string;
    payload: string;
    isActive: boolean;
    startDate: Date;
    expiryDate: Date;
    autoRenew: boolean;
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
            enum: ['monthly', 'yearly'],
        },
        productKey: {
            type: String,
            required: [true, 'Product key is required'],
        },
        purchaseToken: {
            type: String,
            required: [true, 'Purchase token is required'],
            unique: true,
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
    },
    {
        timestamps: true,
    }
);

// Indexes for better query performance
subscriptionSchema.index({ userId: 1, isActive: 1 });
subscriptionSchema.index({ expiryDate: 1 });
subscriptionSchema.index({ purchaseToken: 1 });

const Subscription = mongoose.model<ISubscription>('Subscription', subscriptionSchema);

export default Subscription;

