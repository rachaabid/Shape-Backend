import mongoose, { Schema, Document } from 'mongoose';

export interface IInterview extends Document {
  applicationId: mongoose.Types.ObjectId;
  companyId:     mongoose.Types.ObjectId;
  candidateId:   mongoose.Types.ObjectId;
  jobOfferId:    mongoose.Types.ObjectId;
  scheduledAt:   Date;
  channelName:   string; // Agora channel
  status:        string; // scheduled, completed, cancelled
  notes?:        string;
  createdAt:     Date;
}

const InterviewSchema = new Schema<IInterview>({
  applicationId: { type: Schema.Types.ObjectId, ref: 'JobOfferApplication', required: true },
  companyId:     { type: Schema.Types.ObjectId, ref: 'Company',             required: true },
  candidateId:   { type: Schema.Types.ObjectId, ref: 'User',                required: true },
  jobOfferId:    { type: Schema.Types.ObjectId, ref: 'JobOffer',            required: true },
  scheduledAt:   { type: Date, required: true },
  channelName:   { type: String, required: true },
  status:        { type: String, default: 'scheduled' },
  notes:         String,
}, { timestamps: true });

export default mongoose.model<IInterview>('Interview', InterviewSchema);
