import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkingMode extends Document {
  name:         { fr?: string; en?: string; ar?: string };
  description?: { fr?: string; en?: string; ar?: string };
}

const WorkingModeSchema = new Schema<IWorkingMode>({
  name:        { fr: String, en: String, ar: String },
  description: { fr: String, en: String, ar: String },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model<IWorkingMode>('WorkingMode', WorkingModeSchema);
