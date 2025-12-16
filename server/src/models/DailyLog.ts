import mongoose, { Document, Schema } from 'mongoose';

export interface IIngredient {
    name: string;
    calories: number;
    proteinGrams: number;
    fatGrams: number;
    carbsGrams: number;
}

export interface ILogItem {
    title: string;
    calories: number;
    carbsGrams: number;
    proteinGrams: number;
    fatsGrams: number;
    portions?: number;
    healthScore?: number;
    timeIso: string; // ISO timestamp of when item was added
    imageUrl?: string; // optional image URL or data URI
    description?: string; // optional user-provided description for better analysis
    ingredients?: IIngredient[]; // detailed ingredients breakdown
    liked?: boolean; // whether user liked this item
}

export interface IDailyLog extends Document {
    userId: Schema.Types.ObjectId;
    date: string; // YYYY-MM-DD (local date)
    caloriesConsumed: number;
    carbsGrams: number;
    proteinGrams: number;
    fatsGrams: number;
    burnedCalories: number; // calories burned through exercise/activity
    items: ILogItem[];
    createdAt: Date;
    updatedAt: Date;
}

const logItemSchema = new Schema<ILogItem>({
    title: { type: String, required: true },
    calories: { type: Number, required: true },
    carbsGrams: { type: Number, required: true },
    proteinGrams: { type: Number, required: true },
    fatsGrams: { type: Number, required: true },
    portions: { type: Number, required: false, default: 1 },
    healthScore: { type: Number, required: false, min: 0, max: 10 },
    timeIso: { type: String, required: true },
    imageUrl: { type: String },
    description: { type: String },
    ingredients: [{
        name: { type: String, required: true },
        calories: { type: Number, required: true },
        proteinGrams: { type: Number, required: true },
        fatGrams: { type: Number, required: true },
        carbsGrams: { type: Number, required: true },
    }],
    liked: { type: Boolean, default: false },
});

const dailyLogSchema = new Schema<IDailyLog>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
        date: { type: String, required: true },
        caloriesConsumed: { type: Number, required: true, default: 0 },
        carbsGrams: { type: Number, required: true, default: 0 },
        proteinGrams: { type: Number, required: true, default: 0 },
        fatsGrams: { type: Number, required: true, default: 0 },
        burnedCalories: { type: Number, required: true, default: 0 },
        items: { type: [logItemSchema], default: [] },
    },
    { timestamps: true }
);

dailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

const DailyLog = mongoose.model<IDailyLog>('DailyLog', dailyLogSchema);

export default DailyLog;


