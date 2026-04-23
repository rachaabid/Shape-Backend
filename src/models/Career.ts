import mongoose, { Schema, Document } from 'mongoose';

export interface ICareer extends Document {
  name:     { fr?: string; en?: string; ar?: string };
  domain:   string;
  nameDisplay?: string;
}

const CareerSchema = new Schema<ICareer>({
  name:        { fr: String, en: String, ar: String },
  domain:      { type: String, required: true },
  nameDisplay: String,
});

export default mongoose.model<ICareer>('Career', CareerSchema);
