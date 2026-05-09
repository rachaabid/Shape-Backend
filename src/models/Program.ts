import mongoose, { Schema, Document } from 'mongoose';

export interface IQuizMcOption {
  text:      string;
  isCorrect: boolean;
}

export interface IQuizQuestion {
  type:              'truefalse' | 'simple' | 'multiple';
  text:              string;
  trueFalseAnswer?:  boolean;
  expectedAnswer?:   string;
  options?:          IQuizMcOption[];
}

export interface IQuiz {
  title:            string;
  description?:     string;
  hoursToComplete?: number;
  deadline?:        string;
  questions?:       IQuizQuestion[];
}

export interface ILesson {
  title:            string;
  durationHours?:   number;
  videoUrl?:        string;
  learningOutcome?: string;
  challengeText?:   string;
  keyWords?:        string[];
  references?:      string;
  quizzes?:         IQuiz[];
}

export interface IWeek {
  title:    string;
  lessons?: ILesson[];
}

export interface ICourseContentItem {
  contentType: 'Quiz' | 'TextBloc' | 'VideoYoutube' | 'Video';
  content:     mongoose.Types.ObjectId;
}

export interface ICourse {
  title:    { fr?: string; en?: string; ar?: string };
  contents: ICourseContentItem[];
}

export interface IProgram extends Document {
  title:        { fr?: string; en?: string; ar?: string };
  description?: { fr?: string; en?: string; ar?: string };
  career?:      string;
  skill?:       string;
  courses?:     ICourse[];
  price?:       number;
  duration?:    number;
  order?:       number;
  online?:      boolean;
  deleted?:     boolean;
}

const QuizMcOptionSchema = new Schema<IQuizMcOption>({
  text:      String,
  isCorrect: Boolean,
}, { _id: false });

const QuizQuestionSchema = new Schema<IQuizQuestion>({
  type:             { type: String, enum: ['truefalse', 'simple', 'multiple'] },
  text:             String,
  trueFalseAnswer:  Boolean,
  expectedAnswer:   String,
  options:          [QuizMcOptionSchema],
}, { _id: false });

const QuizSchema = new Schema<IQuiz>({
  title:            String,
  description:      String,
  hoursToComplete:  Number,
  deadline:         String,
  questions:        [QuizQuestionSchema],
}, { _id: false });

const LessonSchema = new Schema<ILesson>({
  title:            String,
  durationHours:    Number,
  videoUrl:         String,
  learningOutcome:  String,
  challengeText:    String,
  keyWords:         [String],
  references:       String,
  quizzes:          [QuizSchema],
}, { _id: false });

const WeekSchema = new Schema<IWeek>({
  title:   String,
  lessons: [LessonSchema],
}, { _id: false });

const CourseContentItemSchema = new Schema<ICourseContentItem>({
  contentType: { type: String, enum: ['Quiz', 'TextBloc', 'VideoYoutube', 'Video'] },
  content:     { type: Schema.Types.ObjectId },
}, { _id: false });

const CourseSchema = new Schema<ICourse>({
  title:    { fr: String, en: String, ar: String },
  contents: [CourseContentItemSchema],
}, { _id: false });

const ProgramSchema = new Schema<IProgram>({
  title:       { fr: String, en: String, ar: String },
  description: { fr: String, en: String, ar: String },
  career:      String,
  skill:       String,
  courses:     [CourseSchema],
  price:       Number,
  duration:    Number,
  order:       Number,
  online:      { type: Boolean, default: false },
  deleted:     { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model<IProgram>('Program', ProgramSchema);
