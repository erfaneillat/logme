import mongoose, { Document, Schema } from 'mongoose';

export interface IReferralLog extends Document {
    referrerId: mongoose.Types.ObjectId; // The user who owns the referral code
    referredUserId: mongoose.Types.ObjectId; // The user who used the referral code
    referralCode: string; // The referral code that was used
    eventType: 'code_submitted' | 'first_purchase' | 'subscription_purchase'; // Type of referral event
    reward: number; // Amount earned by referrer (0 for code_submitted)
    subscriptionPlanType?: 'monthly' | 'yearly' | 'threeMonth'; // Plan type if applicable
    createdAt: Date;
    updatedAt: Date;
}

const referralLogSchema = new Schema<IReferralLog>(
    {
        referrerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Referrer ID is required'],
            index: true,
        },
        referredUserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Referred user ID is required'],
            index: true,
        },
        referralCode: {
            type: String,
            required: [true, 'Referral code is required'],
            uppercase: true,
            trim: true,
            index: true,
        },
        eventType: {
            type: String,
            required: [true, 'Event type is required'],
            enum: ['code_submitted', 'first_purchase', 'subscription_purchase'],
            index: true,
        },
        reward: {
            type: Number,
            required: [true, 'Reward amount is required'],
            default: 0,
            min: 0,
        },
        subscriptionPlanType: {
            type: String,
            required: false,
            enum: ['monthly', 'yearly', 'threeMonth'],
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for efficient queries
referralLogSchema.index({ referrerId: 1, createdAt: -1 });
referralLogSchema.index({ referredUserId: 1, createdAt: -1 });
referralLogSchema.index({ referralCode: 1, createdAt: -1 });

const ReferralLog = mongoose.model<IReferralLog>('ReferralLog', referralLogSchema);

export default ReferralLog;

