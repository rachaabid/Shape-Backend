import mongoose, { Schema, Document } from 'mongoose';

export interface IHardSkill extends Document {
  name:      { fr?: string; en?: string; ar?: string };
  category?: string;
}

const HardSkillSchema = new Schema<IHardSkill>({
  name:     { fr: String, en: String, ar: String },
  category: String,
}, { toJSON: { transform: (_doc: any, ret: any) => {
  if (ret.name && typeof ret.name === 'object') {
    ret.name = ret.name.fr || ret.name.en || ret.name.ar || '';
  }
  return ret;
}}});

export default mongoose.model<IHardSkill>('HardSkill', HardSkillSchema);
