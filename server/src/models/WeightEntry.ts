import mongoose, { Document, Schema } from 'mongoose';

export interface IWeightEntry extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  weightKg: number;
  createdAt: Date;
  updatedAt: Date;
}

const weightEntrySchema = new Schema<IWeightEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true },
    weightKg: { type: Number, required: true, min: 20, max: 400 },
  },
  { timestamps: true }
);

weightEntrySchema.index({ userId: 1, date: 1 }, { unique: true });

const WeightEntry = mongoose.model<IWeightEntry>('WeightEntry', weightEntrySchema);
export default WeightEntry;
