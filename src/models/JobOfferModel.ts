import mongoose, { Schema, Document } from 'mongoose';

export interface IJobOfferModel extends Document {
  name:         { fr?: string; en?: string; ar?: string };
  description?: { fr?: string; en?: string; ar?: string };
}

const JobOfferModelSchema = new Schema<IJobOfferModel>({
  name:        { fr: String, en: String, ar: String },
  description: { fr: String, en: String, ar: String },
});

export default mongoose.model<IJobOfferModel>('JobOfferModel', JobOfferModelSchema);
