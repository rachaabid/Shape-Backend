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
  id?:              string;
  title:            string;
  description?:     string;
  hoursToComplete?: number;
  deadline?:        string;
  questions?:       IQuizQuestion[];
  folders?:         { id?: string; name: string; fileName: string; createdAt?: string }[];
}

export interface ILesson {
  id?:              string;
  title:            string;
  durationHours?:   number;
  videoUrl?:        string;
  videoName?:       string;
  learningOutcome?: string;
  challengeText?:   string;
  keyWords?:        string[];
  references?:      string;
  challenges?:      number;
  folders?:         { fileName: string; fileSize: number }[];
  quizzes?:         IQuiz[];
}

export interface IWeek {
  id?:      string;
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
  weeks?:       IWeek[];
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
  id:               { type: String },
  title:            String,
  description:      String,
  hoursToComplete:  Number,
  deadline:         String,
  questions:        [QuizQuestionSchema],
  folders:          [{ name: String, fileName: String, createdAt: String }],
});

const LessonSchema = new Schema<ILesson>({
  id:               { type: String },
  title:            String,
  durationHours:    Number,
  videoUrl:         String,
  videoName:        String,
  learningOutcome:  String,
  challengeText:    String,
  keyWords:         [String],
  references:       String,
  challenges:       Number,
  folders:          [{ fileName: String, fileSize: Number }],
  quizzes:          [QuizSchema],
});

const WeekSchema = new Schema<IWeek>({
  id:      { type: String },
  title:   String,
  lessons: [LessonSchema],
});

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
  weeks:       [WeekSchema],
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model<IProgram>('Program', ProgramSchema);
