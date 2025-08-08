import mongoose, { Document, Schema } from 'mongoose';

export interface IPlan extends Document {
    userId: Schema.Types.ObjectId;
    calories: number;
    carbsGrams: number;
    proteinGrams: number;
    fatsGrams: number;
    healthScore: number; // 0..10
    targetChangeLbs?: number; // e.g., -11 for lose 11 lbs
    targetDateIso?: string; // ISO date string
    maintenanceCalories?: number; // Daily maintenance calories
    calorieDeficit?: number; // Positive for weight loss, negative for weight gain
    dailyGoal?: string; // "lose_weight", "gain_weight", or "maintain_weight"
    createdAt: Date;
    updatedAt: Date;
}

const planSchema = new Schema<IPlan>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
        calories: { type: Number, required: true },
        carbsGrams: { type: Number, required: true },
        proteinGrams: { type: Number, required: true },
        fatsGrams: { type: Number, required: true },
        healthScore: { type: Number, required: true },
        targetChangeLbs: { type: Number, required: false },
        targetDateIso: { type: String, required: false },
        maintenanceCalories: { type: Number, required: false },
        calorieDeficit: { type: Number, required: false },
        dailyGoal: { type: String, required: false },
    },
    { timestamps: true }
);

const Plan = mongoose.model<IPlan>('Plan', planSchema);

export default Plan;


