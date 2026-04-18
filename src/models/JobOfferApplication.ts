import mongoose, { Schema, Document } from 'mongoose';

// status: 0=NotApplied 1=Received 2=InProgress 3=Denied 4=Hiring
export interface IApplication extends Document {
  user?:        mongoose.Types.ObjectId;
  jobOffer?:    mongoose.Types.ObjectId;
  cv?:          string;
  coverLetter?: string;
  status?:      number;
  matchScore?:  number;
  deleted?:     boolean;
  createdAt:    Date;
}

const ApplicationSchema = new Schema<IApplication>({
  user:        { type: Schema.Types.ObjectId, ref: 'User' },
  jobOffer:    { type: Schema.Types.ObjectId, ref: 'JobOffer' },
  cv:          String,
  coverLetter: String,
  status:      { type: Number, default: 1 },
  matchScore:  Number,
  deleted:     { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model<IApplication>('JobOfferApplication', ApplicationSchema);
