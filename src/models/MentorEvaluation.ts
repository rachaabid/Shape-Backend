import mongoose, { Schema, Document } from 'mongoose';

export interface IMentorEvaluation extends Document {
  mentor:        mongoose.Types.ObjectId;
  intern:        mongoose.Types.ObjectId;
  inscription?:  mongoose.Types.ObjectId;
  period:        string;
  technical:     number; // 0–10
  behavior:      number;
  communication: number;
  initiative:    number;
  globalScore:   number; // computed average
  comment?:      string;
  deleted?:      boolean;
  createdAt:     Date;
}

const MentorEvaluationSchema = new Schema<IMentorEvaluation>({
  mentor:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
  intern:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
  inscription:   { type: Schema.Types.ObjectId, ref: 'Inscription' },
  period:        { type: String, required: true },
  technical:     { type: Number, default: 0, min: 0, max: 10 },
  behavior:      { type: Number, default: 0, min: 0, max: 10 },
  communication: { type: Number, default: 0, min: 0, max: 10 },
  initiative:    { type: Number, default: 0, min: 0, max: 10 },
  globalScore:   { type: Number, default: 0 },
  comment:       String,
  deleted:       { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

MentorEvaluationSchema.pre('save', function (next) {
  this.globalScore = Math.round(
    ((this.technical + this.behavior + this.communication + this.initiative) / 4) * 10
  ) / 10;
  next();
});

export default mongoose.model<IMentorEvaluation>('MentorEvaluation', MentorEvaluationSchema);
