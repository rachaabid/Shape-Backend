import mongoose, { Schema, Document } from 'mongoose';

export interface IQuizQuestion {
  question:      { fr?: string; en?: string; ar?: string };
  options:       { fr?: string[]; en?: string[]; ar?: string[] };
  correctIndex:  number;
}

export interface IQuiz extends Document {
  title:        { fr?: string; en?: string; ar?: string };
  program:      mongoose.Types.ObjectId;
  questions:    IQuizQuestion[];
  passingScore: number; // percentage 0-100
}

const QuizQuestionSchema = new Schema<IQuizQuestion>({
  question:     { fr: String, en: String, ar: String },
  options:      { fr: [String], en: [String], ar: [String] },
  correctIndex: { type: Number, required: true },
}, { _id: false });

const QuizSchema = new Schema<IQuiz>({
  title:        { fr: String, en: String, ar: String },
  program:      { type: Schema.Types.ObjectId, ref: 'Program', required: true },
  questions:    [QuizQuestionSchema],
  passingScore: { type: Number, default: 70 },
}, { timestamps: true });

export default mongoose.model<IQuiz>('Quiz', QuizSchema);
