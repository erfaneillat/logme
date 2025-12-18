import mongoose, { Schema, Document } from 'mongoose';

export interface ISavedKitchenItem extends Document {
    userId: Schema.Types.ObjectId;
    kitchenItemId: string; // The _id from kitchen item
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    image: string;
    prepTime: string;
    difficulty: 'easy' | 'medium' | 'hard';
    ingredients?: Array<{ name: string; amount: string }>;
    instructions?: string;
    savedAt: Date;
}

const SavedKitchenItemSchema = new Schema<ISavedKitchenItem>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        kitchenItemId: { type: String, required: true },
        name: { type: String, required: true },
        calories: { type: Number, required: true },
        protein: { type: Number, required: true },
        carbs: { type: Number, required: true },
        fat: { type: Number, required: true },
        image: { type: String, required: true },
        prepTime: { type: String, required: true },
        difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
        ingredients: [{
            name: { type: String, required: true },
            amount: { type: String, required: true }
        }],
        instructions: { type: String },
        savedAt: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

// Compound index to ensure a user can only save a kitchen item once
SavedKitchenItemSchema.index({ userId: 1, kitchenItemId: 1 }, { unique: true });

export default mongoose.model<ISavedKitchenItem>('SavedKitchenItem', SavedKitchenItemSchema);
