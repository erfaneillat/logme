import mongoose, { Document, Schema } from 'mongoose';

export interface IAdditionalInfo extends Document {
    userId: mongoose.Types.ObjectId;
    gender?: string;
    age?: number;
    weight?: number; // in kg
    height?: number; // in cm
    activityLevel?: string;
    weightGoal?: string;
    workoutFrequency?: string;
    weightLossSpeed?: number; // in kg per week
    createdAt: Date;
    updatedAt: Date;
}

const additionalInfoSchema = new Schema<IAdditionalInfo>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other'],
            required: false,
        },
        age: {
            type: Number,
            min: [1, 'Age must be at least 1'],
            max: [120, 'Age cannot exceed 120'],
            required: false,
        },
        weight: {
            type: Number,
            min: [20, 'Weight must be at least 20 kg'],
            max: [300, 'Weight cannot exceed 300 kg'],
            required: false,
        },
        height: {
            type: Number,
            min: [100, 'Height must be at least 100 cm'],
            max: [250, 'Height cannot exceed 250 cm'],
            required: false,
        },
        activityLevel: {
            type: String,
            enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active'],
            required: false,
        },
        weightGoal: {
            type: String,
            enum: ['lose_weight', 'maintain_weight', 'gain_weight'],
            required: false,
        },
        workoutFrequency: {
            type: String,
            enum: ['0-2', '3-5', '6+'],
            required: false,
        },
        weightLossSpeed: {
            type: Number,
            min: [0.1, 'Weight loss speed must be at least 0.1 kg per week'],
            max: [2.0, 'Weight loss speed cannot exceed 2.0 kg per week'],
            required: false,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for better query performance
additionalInfoSchema.index({ userId: 1 });

const AdditionalInfo = mongoose.model<IAdditionalInfo>('AdditionalInfo', additionalInfoSchema);

export default AdditionalInfo; 