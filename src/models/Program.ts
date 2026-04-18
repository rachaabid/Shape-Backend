import mongoose, { Schema, Document } from 'mongoose';

export interface IProgram extends Document {
  title:        { fr?: string; en?: string; ar?: string };
  description?: { fr?: string; en?: string; ar?: string };
  career?:      string;
  skill?:       string;
  courses?:     string[];
}

const ProgramSchema = new Schema<IProgram>({
  title:       { fr: String, en: String, ar: String },
  description: { fr: String, en: String, ar: String },
  career:      String,
  skill:       String,
  courses:     [String],
});

export default mongoose.model<IProgram>('Program', ProgramSchema);
