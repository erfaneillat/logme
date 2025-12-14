import mongoose, { Document, Schema } from 'mongoose';

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'cancelled' | 'expired';
export type PaymentGateway = 'zarinpal' | 'cafebazaar';

export interface IPayment extends Document {
    userId: mongoose.Types.ObjectId;
    planId: mongoose.Types.ObjectId;
    offerId?: mongoose.Types.ObjectId;
    gateway: PaymentGateway;
    authority: string; // Zarinpal authority code
    amount: number; // Amount in Tomans
    amountRials: number; // Amount in Rials
    status: PaymentStatus;
    refId?: string; // Zarinpal reference ID after successful payment
    cardPan?: string; // Masked card number
    cardHash?: string;
    description: string;
    callbackUrl: string;
    metadata?: Record<string, any>;
    verifiedAt?: Date;
    expiresAt: Date; // Authority expires after ~15 minutes
    createdAt: Date;
    updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },
        planId: {
            type: Schema.Types.ObjectId,
            ref: 'SubscriptionPlan',
            required: [true, 'Plan ID is required'],
        },
        offerId: {
            type: Schema.Types.ObjectId,
            ref: 'Offer',
            required: false,
        },
        gateway: {
            type: String,
            required: [true, 'Payment gateway is required'],
            enum: ['zarinpal', 'cafebazaar'],
            default: 'zarinpal',
        },
        authority: {
            type: String,
            required: [true, 'Authority code is required'],
            unique: true,
            index: true,
        },
        amount: {
            type: Number,
            required: [true, 'Amount in Tomans is required'],
            min: [1000, 'Minimum payment amount is 1000 Tomans'],
        },
        amountRials: {
            type: Number,
            required: [true, 'Amount in Rials is required'],
            min: [10000, 'Minimum payment amount is 10000 Rials'],
        },
        status: {
            type: String,
            required: true,
            enum: ['pending', 'success', 'failed', 'cancelled', 'expired'],
            default: 'pending',
            index: true,
        },
        refId: {
            type: String,
            required: false,
        },
        cardPan: {
            type: String,
            required: false,
        },
        cardHash: {
            type: String,
            required: false,
        },
        description: {
            type: String,
            required: true,
        },
        callbackUrl: {
            type: String,
            required: true,
        },
        metadata: {
            type: Schema.Types.Mixed,
            required: false,
        },
        verifiedAt: {
            type: Date,
            required: false,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for better query performance
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ authority: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });

// Compound index for finding pending payments by user
paymentSchema.index({ userId: 1, status: 1, expiresAt: 1 });

const Payment = mongoose.model<IPayment>('Payment', paymentSchema);

export default Payment;
