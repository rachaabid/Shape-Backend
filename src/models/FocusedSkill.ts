import mongoose, { Schema, Document } from 'mongoose';

export interface IFocusedSkill extends Document {
  name:      { fr?: string; en?: string; ar?: string };
  category?: string;
}

const FocusedSkillSchema = new Schema<IFocusedSkill>({
  name:     { fr: String, en: String, ar: String },
  category: String,
});

export default mongoose.model<IFocusedSkill>('FocusedSkill', FocusedSkillSchema);
