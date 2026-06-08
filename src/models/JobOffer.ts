import mongoose, { Schema, Document } from 'mongoose';

export type WorkingModeEnum = 'remote' | 'onsite' | 'hybrid' | 'freelance';
export type LocalizedString  = { fr?: string; en?: string; ar?: string } | string;

export interface IJobOffer extends Document {
  company?:           mongoose.Types.ObjectId;
  jobOfferModel?:     mongoose.Types.ObjectId;
  workingMode?:       WorkingModeEnum;
  title?:             LocalizedString;
  description?:       LocalizedString;
  whoAreThey?:        LocalizedString;
  requiredProfile?:   LocalizedString;
  recruitmentProcess?:LocalizedString;
  profilesNeeded:     number;
  softSkills:         string[];
  hardSkills:         { skill: mongoose.Types.ObjectId; level: number }[];
  softwareSkills:     { skill: mongoose.Types.ObjectId; level: number }[];
  attributes:         { key: string; value: string; type: number }[];
  status?:            string;
  salaryMin?:         number;
  salaryMax?:         number;
  deleted?:           boolean;
  createdAt:          Date;
}

const JobOfferSchema = new Schema<IJobOffer>({
  company:            { type: Schema.Types.ObjectId, ref: 'User' },
  jobOfferModel:      { type: Schema.Types.ObjectId, ref: 'JobOfferModel' },
  workingMode:        { type: String, enum: ['remote', 'onsite', 'hybrid', 'freelance'] },
  title:              Schema.Types.Mixed,
  description:        Schema.Types.Mixed,
  whoAreThey:         Schema.Types.Mixed,
  requiredProfile:    Schema.Types.Mixed,
  recruitmentProcess: Schema.Types.Mixed,
  profilesNeeded:     { type: Number, default: 1 },
  softSkills:         [String],
  hardSkills:         [{ skill: { type: Schema.Types.ObjectId, ref: 'Skill' }, level: Number }],
  softwareSkills:     [{ skill: { type: Schema.Types.ObjectId, ref: 'Skill' }, level: Number }],
  attributes:         [{ key: String, value: String, type: Number }],
  status:             { type: String, default: 'open' },
  salaryMin:          { type: Number, default: null },
  salaryMax:          { type: Number, default: null },
  deleted:            { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model<IJobOffer>('JobOffer', JobOfferSchema);
