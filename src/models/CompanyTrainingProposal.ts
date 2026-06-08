import mongoose, { Schema, Document } from 'mongoose';

export type ProposalStatus   = 'pending' | 'accepted' | 'rejected';
export type LocalizedString  = { fr?: string; en?: string; ar?: string } | string;

export interface ICompanyTrainingProposal extends Document {
  company:         mongoose.Types.ObjectId;
  proposedBy:      mongoose.Types.ObjectId;
  title:           LocalizedString;
  description?:    LocalizedString;
  career?:         LocalizedString;
  targetAudience?: LocalizedString;
  justification?:  LocalizedString;
  status:          ProposalStatus;
  deleted?:        boolean;
  createdAt:       Date;
}

const CompanyTrainingProposalSchema = new Schema<ICompanyTrainingProposal>({
  company:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
  proposedBy:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title:          { type: Schema.Types.Mixed, required: true },
  description:    Schema.Types.Mixed,
  career:         Schema.Types.Mixed,
  targetAudience: Schema.Types.Mixed,
  justification:  Schema.Types.Mixed,
  status:         { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  deleted:        { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model<ICompanyTrainingProposal>('CompanyTrainingProposal', CompanyTrainingProposalSchema);
