import mongoose, { Schema, Document } from 'mongoose';

export interface IInscription extends Document {
  user?:     mongoose.Types.ObjectId;
  program?:  mongoose.Types.ObjectId;
  status?:   string;
  deleted?:  boolean;
  createdAt: Date;
}

const InscriptionSchema = new Schema<IInscription>({
  user:    { type: Schema.Types.ObjectId, ref: 'User' },
  program: { type: Schema.Types.ObjectId, ref: 'Program' },
  status:  { type: String, default: 'active' },
  deleted: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model<IInscription>('Inscription', InscriptionSchema);
