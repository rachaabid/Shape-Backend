import mongoose, { Schema, Document } from 'mongoose';

export interface IJobOffer extends Document {
  company?:           mongoose.Types.ObjectId;
  jobOfferModel?:     mongoose.Types.ObjectId;
  workingMode?:       mongoose.Types.ObjectId;
  title?:             string;
  description?:       string;
  whoAreThey?:        string;
  requiredProfile?:   string;
  recruitmentProcess?:string;
  profilesNeeded:     number;
  softSkills:         string[];
  hardSkills:         { skill: string; level: number }[];
  softwareSkills:     { skill: string; level: number }[];
  attributes:         { key: string; value: string; type: number }[];
  status?:            string;
  deleted?:           boolean;
  createdAt:          Date;
}

const JobOfferSchema = new Schema<IJobOffer>({
  company:            { type: Schema.Types.ObjectId, ref: 'Company' },
  jobOfferModel:      { type: Schema.Types.ObjectId, ref: 'JobOfferModel' },
  workingMode:        { type: Schema.Types.ObjectId, ref: 'WorkingMode' },
  title:              String,
  description:        String,
  whoAreThey:         String,
  requiredProfile:    String,
  recruitmentProcess: String,
  profilesNeeded:     { type: Number, default: 1 },
  softSkills:         [String],
  hardSkills:         [{ skill: String, level: Number }],
  softwareSkills:     [{ skill: String, level: Number }],
  attributes:         [{ key: String, value: String, type: Number }],
  status:             { type: String, default: 'open' },
  deleted:            { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true } });

export default mongoose.model<IJobOffer>('JobOffer', JobOfferSchema);
