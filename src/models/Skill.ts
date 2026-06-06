import mongoose, { Schema, Document } from 'mongoose';

/**
 * Modèle unifié `Skill` : fusionne HardSkill + SoftwareSkill + FocusedSkill + SoftSkill.
 * Les 4 référentiels étaient structurellement identiques ; ils ne diffèrent que
 * par leur catégorie, désormais portée par l'attribut `type`.
 */
export type SkillType = 'HARD' | 'SOFTWARE' | 'FOCUSED' | 'SOFT';

export interface ISkill extends Document {
  name:         { fr?: string; en?: string; ar?: string };
  description?: { fr?: string; en?: string; ar?: string };
  category?:    string;
  type:         SkillType;
  archived?:    boolean;
}

const SkillSchema = new Schema<ISkill>({
  name:        { fr: String, en: String, ar: String },
  description: { fr: String, en: String, ar: String },
  category:    String,
  type:        { type: String, enum: ['HARD', 'SOFTWARE', 'FOCUSED', 'SOFT'], required: true },
  archived:    { type: Boolean, default: false },
}, {
  timestamps: true,
  toJSON: { virtuals: true, transform: (_doc: any, ret: any) => {
    ret.id = ret._id?.toString();
    if (ret.name && typeof ret.name === 'object') {
      ret.nameDisplay = ret.name.fr || ret.name.en || ret.name.ar || '';
    }
    if (ret.description && typeof ret.description === 'object') {
      ret.descriptionDisplay = ret.description.fr || ret.description.en || ret.description.ar || '';
    }
    return ret;
  }},
  toObject: { virtuals: true },
});

export default mongoose.model<ISkill>('Skill', SkillSchema);
