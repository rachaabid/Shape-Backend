import mongoose, { Schema, Document } from 'mongoose';

export interface ISoftwareSkill extends Document {
  name:      { fr?: string; en?: string; ar?: string };
  category?: string;
}

const SoftwareSkillSchema = new Schema<ISoftwareSkill>({
  name:     { fr: String, en: String, ar: String },
  category: String,
}, { toJSON: { transform: (_doc: any, ret: any) => {
  if (ret.name && typeof ret.name === 'object') {
    ret.name = ret.name.fr || ret.name.en || ret.name.ar || '';
  }
  return ret;
}}});

export default mongoose.model<ISoftwareSkill>('SoftwareSkill', SoftwareSkillSchema);
