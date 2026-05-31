import mongoose, { Schema, Document } from 'mongoose';

export interface IQuizQuestionOption {
  text:  { fr?: string; en?: string; ar?: string };
  score: number;
}

export interface IMultipleChoicesQuestion {
  text:                  { fr?: string; en?: string; ar?: string };
  questionType?:         string;
  minSelection?:         number;
  maxSelection?:         number;
  graphicRepresentation?: number; // 0 = list, 1 = grid
  options:               IQuizQuestionOption[];
}

export interface IQuizSection {
  text:         { fr?: string; en?: string; ar?: string };
  description?: { fr?: string; en?: string; ar?: string };
  questions:    IMultipleChoicesQuestion[];
}

export interface IQuiz extends Document {
  title:          { fr?: string; en?: string; ar?: string };
  description?:   { fr?: string; en?: string; ar?: string };
  keyWords?:      string[];
  online?:        boolean;
  sections:       IQuizSection[];
  deadLineInHours?: number;
  duration?:      number;
  training?:       mongoose.Types.ObjectId;
  deleted?:       boolean;
}

const QuizQuestionOptionSchema = new Schema<IQuizQuestionOption>({
  text:  { fr: String, en: String, ar: String },
  score: { type: Number, default: 0 },
});

const MultipleChoicesQuestionSchema = new Schema<IMultipleChoicesQuestion>({
  text:                  { fr: String, en: String, ar: String },
  questionType:          String,
  minSelection:          { type: Number, default: 1 },
  maxSelection:          { type: Number, default: 1 },
  graphicRepresentation: { type: Number, default: 0 },
  options:               [QuizQuestionOptionSchema],
});

const QuizSectionSchema = new Schema<IQuizSection>({
  text:        { fr: String, en: String, ar: String },
  description: { fr: String, en: String, ar: String },
  questions:   [MultipleChoicesQuestionSchema],
});

const QuizSchema = new Schema<IQuiz>({
  title:          { fr: String, en: String, ar: String },
  description:    { fr: String, en: String, ar: String },
  keyWords:       [String],
  online:         { type: Boolean, default: false },
  sections:       [QuizSectionSchema],
  deadLineInHours: Number,
  duration:       Number,
  training:        { type: Schema.Types.ObjectId, ref: 'Training', default: null },
  deleted:        { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model<IQuiz>('Quiz', QuizSchema);
