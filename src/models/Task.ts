import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  title?:           { fr?: string; en?: string; ar?: string };
  description?:     { fr?: string; en?: string; ar?: string };
  keyWords?:        string[];
  online?:          boolean;
  deadLineInHours?: number;
  documents?:       { name: string; url: string }[];
  deleted?:         boolean;
}

const TaskSchema = new Schema<ITask>({
  title:           { fr: String, en: String, ar: String },
  description:     { fr: String, en: String, ar: String },
  keyWords:        [String],
  online:          Boolean,
  deadLineInHours: Number,
  documents:       [{ name: String, url: String }],
  deleted:         { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model<ITask>('Task', TaskSchema);
