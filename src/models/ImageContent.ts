import mongoose, { Schema, Document } from 'mongoose';

export interface IImageContent extends Document {
  title?:       { fr?: string; en?: string; ar?: string };
  description?: { fr?: string; en?: string; ar?: string };
  keyWords?:    string[];
  online?:      boolean;
  storage?:     mongoose.Types.ObjectId;
  deleted?:     boolean;
}

const ImageContentSchema = new Schema<IImageContent>({
  title:       { fr: String, en: String, ar: String },
  description: { fr: String, en: String, ar: String },
  keyWords:    [String],
  online:      { type: Boolean, default: false },
  storage:     { type: Schema.Types.ObjectId },
  deleted:     { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model<IImageContent>('ImageContent', ImageContentSchema);
