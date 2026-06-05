import mongoose, { Schema, Document } from 'mongoose';

export interface IHardSkill extends Document {
  name:      { fr?: string; en?: string; ar?: string };
  category?: string;
  archived?: boolean;
}

const HardSkillSchema = new Schema<IHardSkill>({
  name:     { fr: String, en: String, ar: String },
  category: String,
  archived: { type: Boolean, default: false },
}, { toJSON: { virtuals: true, transform: (_doc: any, ret: any) => {
  ret.id = ret._id?.toString();
  if (ret.name && typeof ret.name === 'object') {
    ret.nameDisplay = ret.name.fr || ret.name.en || ret.name.ar || '';
  }
  return ret;
}}});

export default mongoose.model<IHardSkill>('HardSkill', HardSkillSchema);
