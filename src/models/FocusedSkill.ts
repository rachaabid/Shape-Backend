import mongoose, { Schema, Document } from 'mongoose';

export interface IFocusedSkill extends Document {
  name:      { fr?: string; en?: string; ar?: string };
  category?: string;
  archived?: boolean;
}

const FocusedSkillSchema = new Schema<IFocusedSkill>({
  name:     { fr: String, en: String, ar: String },
  category: String,
  archived: { type: Boolean, default: false },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model<IFocusedSkill>('FocusedSkill', FocusedSkillSchema);
