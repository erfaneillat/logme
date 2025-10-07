import mongoose, { Document, Schema } from 'mongoose';

export interface ILuckyWheelEvent extends Document {
    userId: mongoose.Types.ObjectId;
    viewedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const luckyWheelEventSchema = new Schema<ILuckyWheelEvent>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },
        viewedAt: {
            type: Date,
            required: [true, 'View date is required'],
            default: Date.now,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient queries
luckyWheelEventSchema.index({ userId: 1, viewedAt: -1 });

// Prevent duplicate events for the same user on the same day
luckyWheelEventSchema.index(
    { userId: 1, viewedAt: 1 },
    {
        unique: true,
        partialFilterExpression: {
            viewedAt: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0)), // Start of today
                $lt: new Date(new Date().setHours(23, 59, 59, 999)) // End of today
            }
        }
    }
);

export default mongoose.model<ILuckyWheelEvent>('LuckyWheelEvent', luckyWheelEventSchema);
