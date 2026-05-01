import mongoose, { Schema, Document } from 'mongoose';

// status: 0=AutoSuggested 1=Applied 2=Rejected 3=Interview 4=Hired 5=Intern
export interface IApplication extends Document {
  user?:              mongoose.Types.ObjectId;
  jobOffer?:          mongoose.Types.ObjectId;
  cv?:                string;
  coverLetter?:       string;
  status?:            number;
  matchScore?:        number;
  skillScore?:        number;
  semanticScore?:     number;
  proposedDate?:      Date;
  confirmedDate?:     Date;
  matchedSkills?:     string[];
  missingSkills?:     string[];
  extractedCvSkills?: string[];
  deleted?:           boolean;
  createdAt:          Date;
}

const ApplicationSchema = new Schema<IApplication>({
  user:              { type: Schema.Types.ObjectId, ref: 'User' },
  jobOffer:          { type: Schema.Types.ObjectId, ref: 'JobOffer' },
  cv:                String,
  coverLetter:       String,
  status:            { type: Number, default: 1 },
  matchScore:        Number,
  skillScore:        Number,
  semanticScore:     Number,
  proposedDate:      Date,
  confirmedDate:     Date,
  matchedSkills:     [String],
  missingSkills:     [String],
  extractedCvSkills: [String],
  deleted:           { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// The frontend expects "userDetails" and "jobOfferDetails" instead of "user" and "jobOffer"
ApplicationSchema.virtual('userDetails').get(function () { return this.user; });
ApplicationSchema.virtual('jobOfferDetails').get(function () { return this.jobOffer; });

export default mongoose.model<IApplication>('JobOfferApplication', ApplicationSchema);
