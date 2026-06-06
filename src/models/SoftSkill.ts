import mongoose, { Schema, Document } from 'mongoose';

export interface ISoftSkill extends Document {
  name:      { fr?: string; en?: string; ar?: string };
  category?: string;
  archived?: boolean;
}

const SoftSkillSchema = new Schema<ISoftSkill>({
  name:     { fr: String, en: String, ar: String },
  category: String,
  archived: { type: Boolean, default: false },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model<ISoftSkill>('SoftSkill', SoftSkillSchema);
