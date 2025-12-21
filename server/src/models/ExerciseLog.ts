import mongoose, { Document, Schema } from 'mongoose';

export interface IExerciseLog extends Document {
    userId: Schema.Types.ObjectId;
    date: string; // YYYY-MM-DD (local date)
    activityName: string;
    activityDescription: string; // Original user input
    duration: number; // in minutes
    caloriesBurned: number;
    intensity: string; // e.g., "کم", "متوسط", "زیاد"
    tips: string[];
    timeIso: string; // ISO timestamp of when exercise was logged
    createdAt: Date;
    updatedAt: Date;
}

const exerciseLogSchema = new Schema<IExerciseLog>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
        date: { type: String, required: true, index: true },
        activityName: { type: String, required: true },
        activityDescription: { type: String, required: true },
        duration: { type: Number, required: true },
        caloriesBurned: { type: Number, required: true },
        intensity: { type: String, required: true, default: 'متوسط' },
        tips: { type: [String], default: [] },
        timeIso: { type: String, required: true },
    },
    { timestamps: true }
);

exerciseLogSchema.index({ userId: 1, date: 1 });
exerciseLogSchema.index({ createdAt: -1 });

const ExerciseLog = mongoose.model<IExerciseLog>('ExerciseLog', exerciseLogSchema);

export default ExerciseLog;
