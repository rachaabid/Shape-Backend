import mongoose, { Schema, Document } from 'mongoose';

export interface IDocFile {
  title?:       { fr?: string; en?: string; ar?: string };
  description?: { fr?: string; en?: string; ar?: string };
  url?:         string;  // external URL or storage path
}

export interface IDocumentation extends Document {
  title?:       { fr?: string; en?: string; ar?: string };
  description?: { fr?: string; en?: string; ar?: string };
  keyWords?:    string[];
  online?:      boolean;
  documents?:   IDocFile[];
  deleted?:     boolean;
}

const DocFileSchema = new Schema<IDocFile>({
  title:       { fr: String, en: String, ar: String },
  description: { fr: String, en: String, ar: String },
  url:         String,
});

const DocumentationSchema = new Schema<IDocumentation>({
  title:       { fr: String, en: String, ar: String },
  description: { fr: String, en: String, ar: String },
  keyWords:    [String],
  online:      { type: Boolean, default: false },
  documents:   [DocFileSchema],
  deleted:     { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model<IDocumentation>('Documentation', DocumentationSchema);
