import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email?: string;
  phone?: string; // Optional for OAuth users
  name?: string;
  password?: string;
  // Authentication provider info
  authProvider: 'phone' | 'google' | 'apple' | 'email';
  providerId?: string; // OAuth provider's user ID
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  isAdmin?: boolean; // Admin access flag
  hasCompletedAdditionalInfo: boolean;
  hasGeneratedPlan: boolean;
  aiCostUsdTotal?: number;
  referralCode?: string;
  referredBy?: string | null; // referral code of the referrer
  referralSuccessCount?: number;
  referralEarnings?: number;
  referralRewardCredited?: boolean; // whether referral reward already credited after first purchase
  // Streak fields
  streakCount?: number; // number of consecutive days completed
  lastStreakDate?: string | null; // YYYY-MM-DD of last completed day
  lastActivity?: Date; // timestamp of last user activity
  lastPlatform?: 'web' | 'ios' | 'android' | 'unknown'; // Platform of last activity
  appVersion?: string;
  oneTimeOfferExpiresAt?: Date;
  // User preferences
  addBurnedCalories?: boolean; // whether to add burned calories to daily goal
  rolloverCalories?: boolean; // whether to rollover remaining calories
  // Preferred language for notifications
  preferredLanguage?: 'en' | 'fa';
  // FCM tokens for push notifications
  fcmTokens?: string[]; // Array of Firebase Cloud Messaging tokens
  verificationCode?: string;
  verificationCodeExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    phone: {
      type: String,
      required: false, // Optional for OAuth users
      unique: true,
      sparse: true, // Allow null/undefined for OAuth users
      trim: true,
    },
    name: {
      type: String,
      required: false,
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    password: {
      type: String,
      required: false,
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    authProvider: {
      type: String,
      enum: ['phone', 'google', 'apple', 'email'],
      default: 'phone',
    },
    providerId: {
      type: String,
      required: false,
      sparse: true,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    hasCompletedAdditionalInfo: {
      type: Boolean,
      default: false,
    },
    hasGeneratedPlan: {
      type: Boolean,
      default: false,
    },
    aiCostUsdTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    referralCode: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },
    referredBy: {
      type: String,
      required: false,
      default: null,
      uppercase: true,
      trim: true,
    },
    referralSuccessCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    referralEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },
    referralRewardCredited: {
      type: Boolean,
      default: false,
    },
    streakCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastStreakDate: {
      type: String,
      required: false,
      default: null,
    },
    lastActivity: {
      type: Date,
      required: false,
      default: null,
    },
    addBurnedCalories: {
      type: Boolean,
      default: true,
    },
    rolloverCalories: {
      type: Boolean,
      default: true,
    },
    preferredLanguage: {
      type: String,
      enum: ['en', 'fa'],
      default: 'en',
    },
    fcmTokens: {
      type: [String],
      default: [],
    },
    verificationCode: {
      type: String,
      required: false,
    },
    verificationCodeExpires: {
      type: Date,
      required: false,
    },
    lastPlatform: {
      type: String,
      enum: ['web', 'ios', 'android', 'unknown'],
      default: 'unknown',
    },
    appVersion: {
      type: String,
      required: false,
    },
    oneTimeOfferExpiresAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc: any, ret: any) {
        const transformed = { ...ret };
        delete transformed.password;
        delete transformed.verificationCode;
        delete transformed.verificationCodeExpires;
        return transformed;
      },
    },
    toObject: {
      transform: function (doc: any, ret: any) {
        const transformed = { ...ret };
        delete transformed.password;
        delete transformed.verificationCode;
        delete transformed.verificationCodeExpires;
        return transformed;
      },
    },
  }
);

// Indexes for better query performance
userSchema.index({ phone: 1 });
userSchema.index({ email: 1 });
userSchema.index({ referralCode: 1 });
userSchema.index({ referredBy: 1 });

// Hash password before saving (only if password exists)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Ensure unique phone and email with proper error handling
userSchema.post('save', function (error: any, doc: any, next: any) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    error.message = `${field} already exists`;
    error.statusCode = 409;
  }
  next(error);
});

const User = mongoose.model<IUser>('User', userSchema);

export default User;
