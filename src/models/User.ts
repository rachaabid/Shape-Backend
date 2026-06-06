import mongoose, { Schema, Document } from 'mongoose';

/**
 * Profil candidat — regroupe les données propres au rôle CANDIDATE.
 * Imbriqué dans User (sous-document) plutôt qu'éclaté à plat.
 */
export interface ICandidateProfile {
  cvStorage?:    string;
  hardSkills?:   { skill: mongoose.Types.ObjectId; level: number }[];
  softwares?:    { skill: mongoose.Types.ObjectId; level: number }[];
  softSkills?:   string[];
  focusedSkills?: string[];
  languages?:    string[];
  workingMode?:  string;
  trainings?:    string[];
  portfolioLinks?: string[];
  professionalExperiences?: {
    jobTitle: string; company: string; locale: string;
    startDate: string; endDate?: string;
  }[];
  academicTrainings?: {
    establishment: string; locale: string; specialization: string;
    studyLevel: string; startDate: string; endDate: string; isStudent: boolean;
  }[];
}

/**
 * Profil entreprise — absorbe l'ancienne classe Company.
 * Présent uniquement pour les User ayant le rôle COMPANY.
 */
export interface ICompanyProfile {
  companyName?: { fr?: string; en?: string; ar?: string };
  logo?:        string;
  address?:     { fr?: string; en?: string; ar?: string };
  sector?:      string;
  website?:     string;
  profession?:  string;
}

/** Profil mentor — données propres au rôle MENTOR. */
export interface IMentorProfile {
  expertise?: string[];
  bio?:       string;
}

export interface IUser extends Document {
  login:                   string;
  email:                   string;
  password:                string;
  roles:                   string[];
  firstName?:              { default?: string; fr?: string; en?: string; ar?: string };
  lastName?:               { default?: string; fr?: string; en?: string; ar?: string };
  firstNameDisplay?:       string;
  lastNameDisplay?:        string;
  phoneNumber?:            string;
  gender?:                 number; // 0=Male 1=Female 2=NoGender
  country?:                string;
  address?:                string;
  postalCode?:             string;
  jobTitle?:               string;
  interfaceLanguage?:      string;
  avatarStorage?:          string;
  candidateProfile?:       ICandidateProfile;
  companyProfile?:         ICompanyProfile;
  mentorProfile?:          IMentorProfile;
  verifiedAccount:         boolean;
  verificationCode?:       string;
  isTermsAccepted?:        boolean;
  deleted?:                boolean;
  archived?:               boolean;
  createdAt:               Date;
}

const CandidateProfileSchema = new Schema<ICandidateProfile>({
  cvStorage:     String,
  hardSkills:    [{ skill: { type: Schema.Types.ObjectId, ref: 'Skill' }, level: Number }],
  softwares:     [{ skill: { type: Schema.Types.ObjectId, ref: 'Skill' }, level: Number }],
  softSkills:    [String],
  focusedSkills: [String],
  languages:     [String],
  workingMode:   String,
  trainings:     [String],
  portfolioLinks: [String],
  professionalExperiences: [{
    jobTitle: String, company: String, locale: String,
    startDate: String, endDate: String,
  }],
  academicTrainings: [{
    establishment: String, locale: String, specialization: String,
    studyLevel: String, startDate: String, endDate: String, isStudent: Boolean,
  }],
}, { _id: false });

const CompanyProfileSchema = new Schema<ICompanyProfile>({
  companyName: { fr: String, en: String, ar: String },
  logo:        String,
  address:     { fr: String, en: String, ar: String },
  sector:      String,
  website:     String,
  profession:  String,
}, { _id: false });

const MentorProfileSchema = new Schema<IMentorProfile>({
  expertise: [String],
  bio:       String,
}, { _id: false });

const UserSchema = new Schema<IUser>({
  login:              { type: String, required: true, unique: true },
  email:              { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:           { type: String, required: true },
  roles:              { type: [String], default: ['COMPANY'] },
  firstName:          { default: String, fr: String, en: String, ar: String },
  lastName:           { default: String, fr: String, en: String, ar: String },
  phoneNumber:        String,
  gender:             Number,
  country:            String,
  address:            String,
  postalCode:         String,
  jobTitle:           String,
  interfaceLanguage:  String,
  avatarStorage:      String,
  candidateProfile:   { type: CandidateProfileSchema, default: undefined },
  companyProfile:     { type: CompanyProfileSchema,   default: undefined },
  mentorProfile:      { type: MentorProfileSchema,    default: undefined },
  verifiedAccount:   { type: Boolean, default: false },
  verificationCode:  String,
  isTermsAccepted:   Boolean,
  deleted:           { type: Boolean, default: false },
  archived:          { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Computed display names from multilingual firstName/lastName
UserSchema.virtual('firstNameDisplay').get(function () {
  const n = this.firstName as any;
  if (!n) return undefined;
  return n.default || n.fr || n.en || n.ar || undefined;
});

UserSchema.virtual('lastNameDisplay').get(function () {
  const n = this.lastName as any;
  if (!n) return undefined;
  return n.default || n.fr || n.en || n.ar || undefined;
});

// ── Compat « entreprise » ──────────────────────────────────────────
// Company a été fusionnée dans User.companyProfile. Ces deux virtuals
// exposent companyName/logo au niveau racine pour que les références
// peuplées (JobOffer.company, Interview.companyId, …) gardent la même
// forme qu'avant ({ name, logo }) côté API — aucune réécriture des fronts.
UserSchema.virtual('name').get(function () {
  return (this.companyProfile as any)?.companyName;
});
UserSchema.virtual('logo').get(function () {
  return (this.companyProfile as any)?.logo;
});

export default mongoose.model<IUser>('User', UserSchema);
