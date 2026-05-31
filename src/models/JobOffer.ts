import mongoose, { Schema, Document } from 'mongoose';

export type WorkingModeEnum = 'remote' | 'onsite' | 'hybrid' | 'freelance';

export interface IJobOffer extends Document {
  company?:           mongoose.Types.ObjectId;
  jobOfferModel?:     mongoose.Types.ObjectId;
  workingMode?:       WorkingModeEnum;
  title?:             string;
  description?:       string;
  whoAreThey?:        string;
  requiredProfile?:   string;
  recruitmentProcess?:string;
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
  company:            { type: Schema.Types.ObjectId, ref: 'Company' },
  jobOfferModel:      { type: Schema.Types.ObjectId, ref: 'JobOfferModel' },
  workingMode:        { type: String, enum: ['remote', 'onsite', 'hybrid', 'freelance'] },
  title:              String,
  description:        String,
  whoAreThey:         String,
  requiredProfile:    String,
  recruitmentProcess: String,
  profilesNeeded:     { type: Number, default: 1 },
  softSkills:         [String],
  hardSkills:         [{ skill: { type: Schema.Types.ObjectId, ref: 'HardSkill' }, level: Number }],
  softwareSkills:     [{ skill: { type: Schema.Types.ObjectId, ref: 'SoftwareSkill' }, level: Number }],
  attributes:         [{ key: String, value: String, type: Number }],
  status:             { type: String, default: 'open' },
  salaryMin:          { type: Number, default: null },
  salaryMax:          { type: Number, default: null },
  deleted:            { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model<IJobOffer>('JobOffer', JobOfferSchema);
