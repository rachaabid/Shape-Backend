import mongoose, { Schema, Document } from 'mongoose';

export interface ICompany extends Document {
  name?:     { fr?: string; en?: string; ar?: string };
  address?:  { fr?: string; en?: string; ar?: string };
  logo?:     string;
  owner?:    mongoose.Types.ObjectId;
  deleted?:  boolean;
  createdAt: Date;
}

const CompanySchema = new Schema<ICompany>({
  name:    { fr: String, en: String, ar: String },
  address: { fr: String, en: String, ar: String },
  logo:    String,
  owner:   { type: Schema.Types.ObjectId, ref: 'User' },
  deleted: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model<ICompany>('Company', CompanySchema);
