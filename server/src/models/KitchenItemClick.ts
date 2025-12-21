import mongoose, { Schema, Document } from 'mongoose';

export interface IKitchenItemClick extends Document {
    kitchenItemId: string;    // The item's _id from within the category
    kitchenItemName: string;  // Name of the item for easy reporting
    categoryId: string;       // The parent category's _id
    categoryTitle: string;    // Title of the category
    subCategoryTitle: string; // Title of the subcategory
    userId?: string;          // Optional: if user is logged in
    createdAt: Date;
}

const KitchenItemClickSchema = new Schema({
    kitchenItemId: { type: String, required: true, index: true },
    kitchenItemName: { type: String, required: true },
    categoryId: { type: String, required: true, index: true },
    categoryTitle: { type: String, required: true },
    subCategoryTitle: { type: String, required: true },
    userId: { type: String, index: true }
}, {
    timestamps: true
});

// Compound index for efficient querying
KitchenItemClickSchema.index({ kitchenItemId: 1, createdAt: -1 });
KitchenItemClickSchema.index({ categoryId: 1, createdAt: -1 });
KitchenItemClickSchema.index({ createdAt: -1 });

export default mongoose.model<IKitchenItemClick>('KitchenItemClick', KitchenItemClickSchema);
