import mongoose, { Schema, Document } from 'mongoose';

export interface ISoftSkill extends Document {
  name:      { fr?: string; en?: string; ar?: string };
  category?: string;
}

const SoftSkillSchema = new Schema<ISoftSkill>({
  name:     { fr: String, en: String, ar: String },
  category: String,
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model<ISoftSkill>('SoftSkill', SoftSkillSchema);
