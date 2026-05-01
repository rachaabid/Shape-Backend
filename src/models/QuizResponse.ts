import mongoose, { Schema, Document } from 'mongoose';

export interface IQuizQuestionResponse {
  quizQuestion: mongoose.Types.ObjectId;
  options:      mongoose.Types.ObjectId[];
}

export interface IQuizResponse extends Document {
  owner?:       mongoose.Types.ObjectId;
  quiz?:        mongoose.Types.ObjectId;
  inscription?: mongoose.Types.ObjectId;
  reponses?:    IQuizQuestionResponse[];
  deleted?:     boolean;
}

const QuizQuestionResponseSchema = new Schema<IQuizQuestionResponse>({
  quizQuestion: { type: Schema.Types.ObjectId },
  options:      [{ type: Schema.Types.ObjectId }],
}, { _id: false });

const QuizResponseSchema = new Schema<IQuizResponse>({
  owner:       { type: Schema.Types.ObjectId, ref: 'User' },
  quiz:        { type: Schema.Types.ObjectId, ref: 'Quiz' },
  inscription: { type: Schema.Types.ObjectId, ref: 'Inscription' },
  reponses:    [QuizQuestionResponseSchema],
  deleted:     { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model<IQuizResponse>('QuizResponse', QuizResponseSchema);
