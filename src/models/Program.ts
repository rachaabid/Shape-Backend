import mongoose, { Schema, Document } from 'mongoose';

export interface IContentLink {
  content:      mongoose.Types.ObjectId;
  contentType?: string;
}

export interface ICourseItem {
  title?:       { fr?: string; en?: string; ar?: string };
  description?: { fr?: string; en?: string; ar?: string };
  contents?:    IContentLink[];
  online?:      boolean;
}

export interface IProgram extends Document {
  title:        { fr?: string; en?: string; ar?: string };
  description?: { fr?: string; en?: string; ar?: string };
  career?:      string;
  skill?:       string;
  courses?:     ICourseItem[];
  price?:       number;
  duration?:    number;
  order?:       number;
  online?:      boolean;
  deleted?:     boolean;
}

const ContentLinkSchema = new Schema<IContentLink>({
  content:     { type: Schema.Types.ObjectId },
  contentType: String,
});

const CourseItemSchema = new Schema<ICourseItem>({
  title:       { fr: String, en: String, ar: String },
  description: { fr: String, en: String, ar: String },
  contents:    [ContentLinkSchema],
  online:      Boolean,
});

const ProgramSchema = new Schema<IProgram>({
  title:       { fr: String, en: String, ar: String },
  description: { fr: String, en: String, ar: String },
  career:      String,
  skill:       String,
  courses:     [CourseItemSchema],
  price:       Number,
  duration:    Number,
  order:       Number,
  online:      { type: Boolean, default: false },
  deleted:     { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model<IProgram>('Program', ProgramSchema);
