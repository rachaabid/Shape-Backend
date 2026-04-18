import mongoose, { Schema, Document } from 'mongoose';

export interface IHardSkill extends Document {
  name:      { fr?: string; en?: string; ar?: string };
  category?: string;
}

const HardSkillSchema = new Schema<IHardSkill>({
  name:     { fr: String, en: String, ar: String },
  category: String,
});

export default mongoose.model<IHardSkill>('HardSkill', HardSkillSchema);
