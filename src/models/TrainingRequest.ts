import mongoose, { Schema, Document } from 'mongoose';

export type TrainingRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ITrainingRequest extends Document {
  user:         mongoose.Types.ObjectId;
  training:      mongoose.Types.ObjectId;
  inscription:  mongoose.Types.ObjectId;
  status:       TrainingRequestStatus;
  deleted?:     boolean;
  createdAt:    Date;
}

const TrainingRequestSchema = new Schema<ITrainingRequest>({
  user:        { type: Schema.Types.ObjectId, ref: 'User',        required: true },
  training:     { type: Schema.Types.ObjectId, ref: 'Training',     required: true },
  inscription: { type: Schema.Types.ObjectId, ref: 'Inscription', required: true },
  status:      { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  deleted:     { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model<ITrainingRequest>('TrainingRequest', TrainingRequestSchema);
