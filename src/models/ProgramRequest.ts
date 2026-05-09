import mongoose, { Schema, Document } from 'mongoose';

export type ProgramRequestStatus = 'pending' | 'approved' | 'rejected';

export interface IProgramRequest extends Document {
  user:         mongoose.Types.ObjectId;
  program:      mongoose.Types.ObjectId;
  inscription:  mongoose.Types.ObjectId;
  status:       ProgramRequestStatus;
  deleted?:     boolean;
  createdAt:    Date;
}

const ProgramRequestSchema = new Schema<IProgramRequest>({
  user:        { type: Schema.Types.ObjectId, ref: 'User',        required: true },
  program:     { type: Schema.Types.ObjectId, ref: 'Program',     required: true },
  inscription: { type: Schema.Types.ObjectId, ref: 'Inscription', required: true },
  status:      { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  deleted:     { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model<IProgramRequest>('ProgramRequest', ProgramRequestSchema);
