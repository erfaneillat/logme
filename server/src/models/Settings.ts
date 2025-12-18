import mongoose, { Document, Schema } from 'mongoose';

export interface IKitchenSettings {
    isEnabled: boolean;
    accessMode: 'all' | 'selected';
    allowedUserIds: string[];
}

export interface ISettings extends Document {
    kitchen: IKitchenSettings;
}

const settingsSchema = new Schema<ISettings>(
    {
        kitchen: {
            isEnabled: { type: Boolean, default: true },
            accessMode: { type: String, enum: ['all', 'selected'], default: 'all' },
            allowedUserIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        },
    },
    { timestamps: true }
);

// We will likely only have one settings document, but using a model allows extensibility
const Settings = mongoose.model<ISettings>('Settings', settingsSchema);
export default Settings;
