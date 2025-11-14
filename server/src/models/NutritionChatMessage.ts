import mongoose, { Document, Schema } from 'mongoose';

export type NutritionChatSenderRole = 'user' | 'assistant';

export interface INutritionChatMessage extends Document {
    userId: Schema.Types.ObjectId;
    senderRole: NutritionChatSenderRole;
    message: string;
    imageUrl?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

const nutritionChatMessageSchema = new Schema<INutritionChatMessage>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        senderRole: {
            type: String,
            enum: ['user', 'assistant'],
            required: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        imageUrl: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

nutritionChatMessageSchema.index({ userId: 1, createdAt: -1 });

const NutritionChatMessage = mongoose.model<INutritionChatMessage>(
    'NutritionChatMessage',
    nutritionChatMessageSchema
);

export default NutritionChatMessage;
