import mongoose, { Document, Schema } from 'mongoose';

export interface IDeletedUser extends Document {
    // Original user data
    originalUserId: string;
    phone: string;
    email?: string;
    name?: string;
    isPhoneVerified: boolean;
    hasCompletedAdditionalInfo: boolean;
    hasGeneratedPlan: boolean;
    aiCostUsdTotal?: number;
    referralCode?: string;
    referredBy?: string | null;
    referralSuccessCount?: number;
    referralEarnings?: number;
    streakCount?: number;
    lastStreakDate?: string | null;
    lastActivity?: Date;
    addBurnedCalories?: boolean;
    rolloverCalories?: boolean;

    // Deletion metadata
    deletionReason?: string;
    deletedAt: Date;
    deletedBy: 'user' | 'admin' | 'system';

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

const deletedUserSchema = new Schema<IDeletedUser>(
    {
        originalUserId: {
            type: String,
            required: true,
            index: true,
        },
        phone: {
            type: String,
            required: true,
            index: true,
        },
        email: {
            type: String,
            required: false,
            lowercase: true,
            trim: true,
        },
        name: {
            type: String,
            required: false,
            trim: true,
        },
        isPhoneVerified: {
            type: Boolean,
            default: false,
        },
        hasCompletedAdditionalInfo: {
            type: Boolean,
            default: false,
        },
        hasGeneratedPlan: {
            type: Boolean,
            default: false,
        },
        aiCostUsdTotal: {
            type: Number,
            default: 0,
            min: 0,
        },
        referralCode: {
            type: String,
            required: false,
            uppercase: true,
            trim: true,
        },
        referredBy: {
            type: String,
            required: false,
            default: null,
            uppercase: true,
            trim: true,
        },
        referralSuccessCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        referralEarnings: {
            type: Number,
            default: 0,
            min: 0,
        },
        streakCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        lastStreakDate: {
            type: String,
            required: false,
            default: null,
        },
        lastActivity: {
            type: Date,
            required: false,
            default: null,
        },
        addBurnedCalories: {
            type: Boolean,
            default: true,
        },
        rolloverCalories: {
            type: Boolean,
            default: true,
        },
        deletionReason: {
            type: String,
            required: false,
            trim: true,
        },
        deletedAt: {
            type: Date,
            required: true,
            default: Date.now,
        },
        deletedBy: {
            type: String,
            required: true,
            enum: ['user', 'admin', 'system'],
            default: 'user',
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for better query performance
deletedUserSchema.index({ originalUserId: 1 });
deletedUserSchema.index({ phone: 1 });
deletedUserSchema.index({ deletedAt: -1 });
deletedUserSchema.index({ deletedBy: 1 });

const DeletedUser = mongoose.model<IDeletedUser>('DeletedUser', deletedUserSchema);

export default DeletedUser;
