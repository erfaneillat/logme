import mongoose, { Document, Schema } from 'mongoose';

export interface IStreak extends Document {
  userId: Schema.Types.ObjectId;
  date: string; // YYYY-MM-DD (local date)
  completed: boolean; // whether goal met on that date
  createdAt: Date;
  updatedAt: Date;
}

const streakSchema = new Schema<IStreak>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    date: { type: String, required: true },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

streakSchema.index({ userId: 1, date: 1 }, { unique: true });

const Streak = mongoose.model<IStreak>('Streak', streakSchema);

export default Streak;
