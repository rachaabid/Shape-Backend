import mongoose, { Schema, Document } from 'mongoose';

export interface IVideoYoutube extends Document {
  title?:       { fr?: string; en?: string; ar?: string };
  description?: { fr?: string; en?: string; ar?: string };
  keyWords?:    string[];
  online?:      boolean;
  url?:         string;
  deleted?:     boolean;
}

const VideoYoutubeSchema = new Schema<IVideoYoutube>({
  title:       { fr: String, en: String, ar: String },
  description: { fr: String, en: String, ar: String },
  keyWords:    [String],
  online:      { type: Boolean, default: false },
  url:         String,
  deleted:     { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model<IVideoYoutube>('VideoYoutube', VideoYoutubeSchema);
