import mongoose, { Schema, Document } from 'mongoose';

export interface ISoftwareSkill extends Document {
  name:      { fr?: string; en?: string; ar?: string };
  category?: string;
}

const SoftwareSkillSchema = new Schema<ISoftwareSkill>({
  name:     { fr: String, en: String, ar: String },
  category: String,
});

export default mongoose.model<ISoftwareSkill>('SoftwareSkill', SoftwareSkillSchema);
