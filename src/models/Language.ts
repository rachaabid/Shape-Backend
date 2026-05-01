import mongoose, { Schema, Document } from 'mongoose';

export interface ILanguage extends Document {
  name:  { fr?: string; en?: string; ar?: string };
  code?: string;
  flag?: string;
}

const LanguageSchema = new Schema<ILanguage>({
  name: { fr: String, en: String, ar: String },
  code: String,
  flag: String,
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model<ILanguage>('Language', LanguageSchema);
