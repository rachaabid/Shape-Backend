import mongoose, { Schema, Document } from 'mongoose';

export interface ICareer extends Document {
  name:         { fr?: string; en?: string; ar?: string };
  description?: { fr?: string; en?: string; ar?: string };
  domain?:      string;
  online?:      boolean;
}

const CareerSchema = new Schema<ICareer>({
  name:        { fr: String, en: String, ar: String },
  description: { fr: String, en: String, ar: String },
  domain:      { type: String, default: null },
  online:      { type: Boolean, default: true },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model<ICareer>('Career', CareerSchema);
