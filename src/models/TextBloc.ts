import mongoose, { Schema, Document } from 'mongoose';

export interface ITextBloc extends Document {
  title?:       { fr?: string; en?: string; ar?: string };
  description?: { fr?: string; en?: string; ar?: string };
  keyWords?:    string[];
  online?:      boolean;
  html?:        string;
  images?:      mongoose.Types.ObjectId[];
  videos?:      mongoose.Types.ObjectId[];
  deleted?:     boolean;
}

const TextBlocSchema = new Schema<ITextBloc>({
  title:       { fr: String, en: String, ar: String },
  description: { fr: String, en: String, ar: String },
  keyWords:    [String],
  online:      { type: Boolean, default: false },
  html:        String,
  images:      [{ type: Schema.Types.ObjectId }],
  videos:      [{ type: Schema.Types.ObjectId }],
  deleted:     { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model<ITextBloc>('TextBloc', TextBlocSchema);
