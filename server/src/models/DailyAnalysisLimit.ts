import mongoose, { Document, Schema } from 'mongoose';

export interface IDailyAnalysisLimit extends Document {
    userId: mongoose.Types.ObjectId;
    date: string; // YYYY-MM-DD format
    analysisCount: number; // How many times user analyzed an image today
    createdAt: Date;
    updatedAt: Date;
}

const dailyAnalysisLimitSchema = new Schema<IDailyAnalysisLimit>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },
        date: {
            type: String, // YYYY-MM-DD format
            required: [true, 'Date is required'],
            index: true,
        },
        analysisCount: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient queries
dailyAnalysisLimitSchema.index({ userId: 1, date: 1 }, { unique: true });

const DailyAnalysisLimit = mongoose.model<IDailyAnalysisLimit>(
    'DailyAnalysisLimit',
    dailyAnalysisLimitSchema
);

export default DailyAnalysisLimit;
