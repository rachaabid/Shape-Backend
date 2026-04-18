import mongoose, { Schema, Document } from 'mongoose';

export interface ICountry extends Document {
  name:  { fr?: string; en?: string; ar?: string };
  code?: string;
  flag?: string;
}

const CountrySchema = new Schema<ICountry>({
  name: { fr: String, en: String, ar: String },
  code: String,
  flag: String,
});

export default mongoose.model<ICountry>('Country', CountrySchema);
