import mongoose, { Schema, Document } from 'mongoose';

export type ProposalStatus = 'pending' | 'accepted' | 'rejected';

export interface ICompanyProgramProposal extends Document {
  company:        mongoose.Types.ObjectId;
  proposedBy:     mongoose.Types.ObjectId;
  title:          string;
  description?:   string;
  career?:        string;
  targetAudience?: string;
  justification?:  string;
  status:         ProposalStatus;
  deleted?:       boolean;
  createdAt:      Date;
}

const CompanyProgramProposalSchema = new Schema<ICompanyProgramProposal>({
  company:        { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  proposedBy:     { type: Schema.Types.ObjectId, ref: 'User',    required: true },
  title:          { type: String, required: true },
  description:    String,
  career:         String,
  targetAudience: String,
  justification:  String,
  status:         { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  deleted:        { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model<ICompanyProgramProposal>('CompanyProgramProposal', CompanyProgramProposalSchema);
