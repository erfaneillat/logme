import mongoose, { Document, Schema } from 'mongoose';

export interface IAppVersion extends Document {
  platform: 'ios' | 'android';
  version: string; // e.g., "1.0.0"
  buildNumber: number; // e.g., 100
  minVersion: string; // Minimum required version for force update
  minBuildNumber: number; // Minimum required build number for force update
  isForceUpdate: boolean; // Whether this version requires a force update
  isOptionalUpdate: boolean; // Whether there's an optional update available
  updateTitle?: string; // Title for update dialog
  updateMessage?: string; // Message for update dialog
  storeUrl?: string; // App store URL for this platform
  isActive: boolean; // Whether this version configuration is active
  createdAt: Date;
  updatedAt: Date;
}

const appVersionSchema = new Schema<IAppVersion>(
  {
    platform: {
      type: String,
      required: [true, 'Platform is required'],
      enum: ['ios', 'android'],
    },
    version: {
      type: String,
      required: [true, 'Version is required'],
      trim: true,
    },
    buildNumber: {
      type: Number,
      required: [true, 'Build number is required'],
      min: [1, 'Build number must be at least 1'],
    },
    minVersion: {
      type: String,
      required: [true, 'Minimum version is required'],
      trim: true,
    },
    minBuildNumber: {
      type: Number,
      required: [true, 'Minimum build number is required'],
      min: [1, 'Minimum build number must be at least 1'],
    },
    isForceUpdate: {
      type: Boolean,
      default: false,
    },
    isOptionalUpdate: {
      type: Boolean,
      default: false,
    },
    updateTitle: {
      type: String,
      required: false,
      trim: true,
    },
    updateMessage: {
      type: String,
      required: false,
      trim: true,
    },
    storeUrl: {
      type: String,
      required: false,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
appVersionSchema.index({ platform: 1, isActive: 1 });
appVersionSchema.index({ platform: 1, buildNumber: 1 });

// Ensure only one active configuration per platform
appVersionSchema.index({ platform: 1, isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

const AppVersion = mongoose.model<IAppVersion>('AppVersion', appVersionSchema);

export default AppVersion;
