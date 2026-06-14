import mongoose, { Schema, Document } from 'mongoose';

/**
 * Entité polymorphe couvrant les deux types d'appels video du backlog :
 * - `recruitment` (US34) : entretien Entreprise <-> Candidat lie a une candidature.
 * - `mentoring`   (US33) : session Mentor <-> Candidat liee a une inscription.
 *
 * Les champs `companyId`/`applicationId`/`jobOfferId` ne sont obligatoires que
 * pour `recruitment` ; `mentorId`/`inscriptionId` ne le sont que pour `mentoring`.
 * La validation est forcee par un hook `pre('validate')`.
 */
export type InterviewKind = 'recruitment' | 'mentoring';

export interface IInterview extends Document {
  kind:                  InterviewKind;
  candidateId:           mongoose.Types.ObjectId;
  // Recruitment
  companyId?:            mongoose.Types.ObjectId;
  applicationId?:        mongoose.Types.ObjectId;
  jobOfferId?:           mongoose.Types.ObjectId;
  // Mentoring
  mentorId?:             mongoose.Types.ObjectId;
  inscriptionId?:        mongoose.Types.ObjectId;
  // Communs
  scheduledAt:           Date;
  channelName:           string;
  status:                string;       // scheduled | confirmed | completed | cancelled
  notes?:                string;
  confirmedByCandidate:  boolean;
  confirmedByCompany:    boolean;
  confirmedByMentor:     boolean;
  confirmToken?:         string;
  createdAt:             Date;
}

const InterviewSchema = new Schema<IInterview>({
  kind:                 { type: String, enum: ['recruitment', 'mentoring'], default: 'recruitment' },
  candidateId:          { type: Schema.Types.ObjectId, ref: 'User',                required: true },
  companyId:            { type: Schema.Types.ObjectId, ref: 'User' },
  applicationId:        { type: Schema.Types.ObjectId, ref: 'JobOfferApplication' },
  jobOfferId:           { type: Schema.Types.ObjectId, ref: 'JobOffer' },
  mentorId:             { type: Schema.Types.ObjectId, ref: 'User' },
  inscriptionId:        { type: Schema.Types.ObjectId, ref: 'Inscription' },
  scheduledAt:          { type: Date, required: true },
  channelName:          { type: String, required: true },
  status:               { type: String, default: 'scheduled' },
  notes:                String,
  confirmedByCandidate: { type: Boolean, default: false },
  confirmedByCompany:   { type: Boolean, default: false },
  confirmedByMentor:    { type: Boolean, default: false },
  confirmToken:         String,
}, { timestamps: true });

// Validation des champs obligatoires selon le type d'entretien.
// Pour les documents existants sans `kind`, on infere depuis la presence des
// champs : si `companyId` est present -> recruitment, sinon mentoring.
InterviewSchema.pre('validate', function (next) {
  if (!this.kind) this.kind = this.companyId ? 'recruitment' : 'mentoring';

  if (this.kind === 'recruitment') {
    if (!this.companyId || !this.applicationId) {
      return next(new Error('Interview RECRUITMENT : companyId et applicationId requis'));
    }
  } else if (this.kind === 'mentoring') {
    if (!this.mentorId) {
      return next(new Error('Interview MENTORING : mentorId requis'));
    }
  }
  next();
});

export default mongoose.model<IInterview>('Interview', InterviewSchema);