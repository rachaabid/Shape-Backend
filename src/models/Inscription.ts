import mongoose, { Schema, Document } from 'mongoose';

export interface IInscription extends Document {
  user?:      mongoose.Types.ObjectId;
  mentor?:    mongoose.Types.ObjectId;
  trainings?:  mongoose.Types.ObjectId[]; // liste des programmes inscrits
  payement?:  mongoose.Types.ObjectId;
  closed?:    boolean;
  status?:    string;
  deleted?:   boolean;
  createdAt:  Date;
}

const InscriptionSchema = new Schema<IInscription>({
  user:     { type: Schema.Types.ObjectId, ref: 'User' },
  mentor:   { type: Schema.Types.ObjectId, ref: 'User' },
  trainings: [{ type: Schema.Types.ObjectId, ref: 'Training' }],
  payement: { type: Schema.Types.ObjectId },
  closed:   { type: Boolean, default: false },
  status:   { type: String, default: 'active' },
  deleted:  { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model<IInscription>('Inscription', InscriptionSchema);
