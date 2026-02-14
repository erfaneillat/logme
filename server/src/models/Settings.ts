import mongoose, { Document, Schema } from 'mongoose';

export interface IKitchenSettings {
    isEnabled: boolean;
    accessMode: 'all' | 'selected';
    allowedUserIds: string[];
}

export interface IAiChatSettings {
    provider: 'openai' | 'deepseek';
    openaiModel: string;
    deepseekModel: string;
    enableFallback: boolean;
}

export interface ISettings extends Document {
    kitchen: IKitchenSettings;
    aiChat: IAiChatSettings;
}

const settingsSchema = new Schema<ISettings>(
    {
        kitchen: {
            isEnabled: { type: Boolean, default: true },
            accessMode: { type: String, enum: ['all', 'selected'], default: 'all' },
            allowedUserIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        },
        aiChat: {
            provider: { type: String, enum: ['openai', 'deepseek'], default: 'openai' },
            openaiModel: { type: String, default: 'gpt-5-mini' },
            deepseekModel: { type: String, default: 'deepseek-chat' },
            enableFallback: { type: Boolean, default: true },
        },
    },
    { timestamps: true }
);

// We will likely only have one settings document, but using a model allows extensibility
const Settings = mongoose.model<ISettings>('Settings', settingsSchema);
export default Settings;
