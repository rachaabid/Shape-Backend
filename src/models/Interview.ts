import mongoose, { Schema, Document } from 'mongoose';

/**
 * Entité polymorphe couvrant les trois types d'événement du backlog :
 * - `recruitment` (US34) : entretien Entreprise <-> Candidat lie a une candidature.
 * - `mentoring`   (US33) : session Mentor <-> Candidat liee a une inscription.
 * - `appointment` : créneau d'agenda du mentor (avec ou sans stagiaire),
 *                    moins formel — pas de workflow de confirmation, lien de
 *                    réunion externe possible (Zoom/Meet). Remplace l'ancien
 *                    modèle MentorAppointment.
 *
 * La validation est forcée par un hook `pre('validate')` qui fait respecter
 * les champs obligatoires propres à chaque type.
 */
export type InterviewKind = 'recruitment' | 'mentoring' | 'appointment';

export interface IInterview extends Document {
  kind:                  InterviewKind;
  candidateId?:          mongoose.Types.ObjectId; // optionnel pour 'appointment'
  // Recruitment
  companyId?:            mongoose.Types.ObjectId;
  applicationId?:        mongoose.Types.ObjectId;
  jobOfferId?:           mongoose.Types.ObjectId;
  // Mentoring / Appointment
  mentorId?:             mongoose.Types.ObjectId;
  inscriptionId?:        mongoose.Types.ObjectId;
  // Spécifiques à 'appointment'
  title?:                string;
  subtitle?:             string;
  endAt?:                Date;       // borne de fin (créneau)
  meetingLink?:          string;     // lien externe Zoom/Meet
  // Communs
  scheduledAt:           Date;
  channelName?:          string;     // canal Agora (recruitment/mentoring) ; vide pour appointment
  status:                string;       // scheduled | confirmed | completed | cancelled
  notes?:                string;
  confirmedByCandidate:  boolean;
  confirmedByCompany:    boolean;
  confirmedByMentor:     boolean;
  confirmToken?:         string;
  deleted?:              boolean;
  createdAt:             Date;
}

const InterviewSchema = new Schema<IInterview>({
  kind:                 { type: String, enum: ['recruitment', 'mentoring', 'appointment'], default: 'recruitment' },
  candidateId:          { type: Schema.Types.ObjectId, ref: 'User' },
  companyId:            { type: Schema.Types.ObjectId, ref: 'User' },
  applicationId:        { type: Schema.Types.ObjectId, ref: 'JobOfferApplication' },
  jobOfferId:           { type: Schema.Types.ObjectId, ref: 'JobOffer' },
  mentorId:             { type: Schema.Types.ObjectId, ref: 'User' },
  inscriptionId:        { type: Schema.Types.ObjectId, ref: 'Inscription' },
  title:                String,
  subtitle:             String,
  endAt:                Date,
  meetingLink:          String,
  scheduledAt:          { type: Date, required: true },
  channelName:          String,
  status:               { type: String, default: 'scheduled' },
  notes:                String,
  confirmedByCandidate: { type: Boolean, default: false },
  confirmedByCompany:   { type: Boolean, default: false },
  confirmedByMentor:    { type: Boolean, default: false },
  confirmToken:         String,
  deleted:              { type: Boolean, default: false },
}, { timestamps: true });

// Validation des champs obligatoires selon le type d'événement.
// Pour les documents existants sans `kind`, on infère depuis la présence des
// champs : si `companyId` -> recruitment, sinon si `candidateId` -> mentoring,
// sinon -> appointment.
InterviewSchema.pre('validate', function (next) {
  if (!this.kind) {
    if (this.companyId)            this.kind = 'recruitment';
    else if (this.candidateId)     this.kind = 'mentoring';
    else                           this.kind = 'appointment';
  }

  if (this.kind === 'recruitment') {
    if (!this.candidateId || !this.companyId || !this.applicationId) {
      return next(new Error('Interview RECRUITMENT : candidateId, companyId et applicationId requis'));
    }
    if (!this.channelName) return next(new Error('Interview RECRUITMENT : channelName requis'));
  } else if (this.kind === 'mentoring') {
    if (!this.candidateId || !this.mentorId) {
      return next(new Error('Interview MENTORING : candidateId et mentorId requis'));
    }
    if (!this.channelName) return next(new Error('Interview MENTORING : channelName requis'));
  } else if (this.kind === 'appointment') {
    if (!this.mentorId) return next(new Error('Interview APPOINTMENT : mentorId requis'));
    // candidateId optionnel (créneau sans stagiaire), channelName facultatif.
  }
  next();
});

export default mongoose.model<IInterview>('Interview', InterviewSchema);