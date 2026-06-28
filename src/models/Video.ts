import mongoose, { Schema, Document } from 'mongoose';

export interface IVideo extends Document {
  title?:       { fr?: string; en?: string; ar?: string };
  description?: { fr?: string; en?: string; ar?: string };
  keyWords?:    string[];
  online?:      boolean;
  source:       'upload' | 'youtube';   // discriminateur : fichier uploadé ou lien YouTube
  storage?:     mongoose.Types.ObjectId; // utilisé quand source = 'upload'
  url?:         string;                  // utilisé quand source = 'youtube'
  deleted?:     boolean;
}

const VideoSchema = new Schema<IVideo>({
  title:       { fr: String, en: String, ar: String },
  description: { fr: String, en: String, ar: String },
  keyWords:    [String],
  online:      { type: Boolean, default: false },
  source:      { type: String, enum: ['upload', 'youtube'], required: true, default: 'upload' },
  storage:     { type: Schema.Types.ObjectId },
  url:         { type: String },
  deleted:     { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model<IVideo>('Video', VideoSchema);
