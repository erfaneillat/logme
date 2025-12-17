import mongoose, { Schema, Document } from 'mongoose';

export interface IKitchenItem {
    id?: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    image: string; // URL or emoji
    prepTime: string; // e.g., "15 min"
    difficulty: 'easy' | 'medium' | 'hard';
}

export interface IKitchenSubCategory {
    title: string;
    items: IKitchenItem[];
}

export interface IKitchenCategory extends Document {
    title: string;
    subCategories: IKitchenSubCategory[];
    isActive: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

const KitchenItemSchema = new Schema({
    name: { type: String, required: true },
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fat: { type: Number, required: true },
    image: { type: String, required: true },
    prepTime: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true, default: 'medium' }
});

const KitchenSubCategorySchema = new Schema({
    title: { type: String, required: true },
    items: [KitchenItemSchema]
});

const KitchenCategorySchema = new Schema({
    title: { type: String, required: true },
    subCategories: [KitchenSubCategorySchema],
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
}, {
    timestamps: true
});

export default mongoose.model<IKitchenCategory>('KitchenCategory', KitchenCategorySchema);
