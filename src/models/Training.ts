import mongoose, { Schema, Document } from 'mongoose';

// ── Inline quiz structures (backoffice / mentor editor) ────────────────────────
export interface IInlineQuizMcOption {
  text:      string;
  isCorrect: boolean;
}

export interface IInlineQuizQuestion {
  type:              'truefalse' | 'simple' | 'multiple';
  text:              string;
  trueFalseAnswer?:  boolean;
  expectedAnswer?:   string;
  options?:          IInlineQuizMcOption[];
}

export interface IInlineQuiz {
  id?:              string;
  title:            any;   // string or { fr, en, ar }
  description?:     string;
  hoursToComplete?: number;
  deadline?:        string;
  questions?:       IInlineQuizQuestion[];
  folders?:         { id?: string; name: string; fileName: string; createdAt?: string }[];
}

// ── Lesson ────────────────────────────────────────────────────────────────────
export interface ILessonFolder {
  fileName: string;
  fileSize?: number;
  url?: string;   // external URL — used as download target and file id
  id?: string;    // storage id (uploaded files)
}

export interface ILesson {
  id?:              string;
  title:            any;    // string or { fr, en, ar }
  durationHours?:   number;
  videoUrl?:        string;
  videoName?:       string;
  learningOutcome?: string;
  challengeText?:   string;
  htmlContent?:     string; // rich HTML content (replaces TextBloc reference)
  keyWords?:        string[];
  references?:      string;
  challenges?:      number;
  folders?:         ILessonFolder[];
  taskRef?:         string; // ID of a Task document → project management
  quizzes?:         IInlineQuiz[];
}

// ── Week ──────────────────────────────────────────────────────────────────────
export interface IWeek {
  id?:      string;
  title:    any;   // string or { fr, en, ar }
  lessons?: ILesson[];
}

// ── Courses/contents (legacy seed structure — kept for backward compat) ────────
export interface ICourseContentItem {
  contentType: 'Quiz' | 'TextBloc' | 'VideoYoutube' | 'Video' | 'Documentation' | 'Task';
  content:     mongoose.Types.ObjectId;
}

export interface ICourse {
  title:    { fr?: string; en?: string; ar?: string };
  contents: ICourseContentItem[];
  weeks?:   IWeek[];
}

// ── Training ───────────────────────────────────────────────────────────────────
export interface ITraining extends Document {
  title:        { fr?: string; en?: string; ar?: string };
  description?: { fr?: string; en?: string; ar?: string };
  career?:      any;   // string or { fr, en, ar }
  skill?:       any;   // string or { fr, en, ar }
  weeks?:       IWeek[];   // PRIMARY — backoffice + seed both write here
  courses?:     ICourse[]; // LEGACY — old seed format, kept for backward compat
  price?:       number;
  priceEur?:    number;
  duration?:    number;
  order?:       number;
  online?:      boolean;
  deleted?:     boolean;
  archived?:    boolean;
  owner?:       mongoose.Types.ObjectId;
}

// ── Mongoose schemas ──────────────────────────────────────────────────────────
const QuizMcOptionSchema = new Schema<IInlineQuizMcOption>({
  text:      String,
  isCorrect: Boolean,
}, { _id: false });

const QuizQuestionSchema = new Schema<IInlineQuizQuestion>({
  type:             { type: String, enum: ['truefalse', 'simple', 'multiple'] },
  text:             String,
  trueFalseAnswer:  Boolean,
  expectedAnswer:   String,
  options:          [QuizMcOptionSchema],
}, { _id: false });

const QuizSchema = new Schema<IInlineQuiz>({
  id:              { type: String },
  title:           { type: Schema.Types.Mixed }, // string or { fr, en, ar }
  description:     String,
  hoursToComplete: Number,
  deadline:        String,
  questions:       [QuizQuestionSchema],
  folders:         [{ name: String, fileName: String, createdAt: String }],
});

const LessonFolderSchema = new Schema<ILessonFolder>({
  fileName: String,
  fileSize: Number,
  url:      String, // external URL for documentation files
  id:       String, // storage id for uploaded files
}, { _id: false });

const LessonSchema = new Schema<ILesson>({
  id:              { type: String },
  title:           { type: Schema.Types.Mixed }, // string or { fr, en, ar }
  durationHours:   Number,
  videoUrl:        String,
  videoName:       String,
  learningOutcome: String,
  challengeText:   String,
  htmlContent:     String,
  keyWords:        [String],
  references:      String,
  challenges:      Number,
  folders:         [LessonFolderSchema],
  taskRef:         String,
  quizzes:         [QuizSchema],
});

const WeekSchema = new Schema<IWeek>({
  id:      { type: String },
  title:   { type: Schema.Types.Mixed }, // string or { fr, en, ar }
  lessons: [LessonSchema],
});

// Legacy content-type refs
const CourseContentItemSchema = new Schema<ICourseContentItem>({
  contentType: { type: String, enum: ['Quiz', 'TextBloc', 'VideoYoutube', 'Video', 'Documentation', 'Task'] },
  content:     { type: Schema.Types.ObjectId },
}, { _id: false });

const CourseSchema = new Schema<ICourse>({
  title:    { fr: String, en: String, ar: String },
  contents: [CourseContentItemSchema],
  weeks:    [WeekSchema],
}, { _id: false });

const TrainingSchema = new Schema<ITraining>({
  title:       { fr: String, en: String, ar: String },
  description: { fr: String, en: String, ar: String },
  career:      { type: Schema.Types.Mixed },
  skill:       { type: Schema.Types.Mixed },
  weeks:       [WeekSchema],
  courses:     [CourseSchema],
  price:       Number,
  priceEur:    Number,
  duration:    Number,
  order:       Number,
  online:      { type: Boolean, default: false },
  deleted:     { type: Boolean, default: false },
  archived:    { type: Boolean, default: false },
  owner:       { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model<ITraining>('Training', TrainingSchema);
