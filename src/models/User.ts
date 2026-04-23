import mongoose, { Schema, Document } from 'mongoose';

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
  cvStorage?:              string;
  hardSkills?:             { skill: mongoose.Types.ObjectId; level: number }[];
  softwares?:              { skill: mongoose.Types.ObjectId; level: number }[];
  softSkills?:             string[];
  focusedSkills?:          string[];
  languages?:              string[];
  workingMode?:            string;
  programs?:               string[];
  portfolioLinks?:         string[];
  professionalExperiences?: {
    jobTitle: string; company: string; locale: string;
    startDate: string; endDate?: string;
  }[];
  academicTrainings?: {
    establishment: string; locale: string; specialization: string;
    studyLevel: string; startDate: string; endDate: string; isStudent: boolean;
  }[];
  verifiedAccount:         boolean;
  verificationCode?:       string;
  isTermsAccepted?:        boolean;
  deleted?:                boolean;
  createdAt:               Date;
}

const UserSchema = new Schema<IUser>({
  login:              { type: String, required: true, unique: true },
  email:              { type: String, required: true, unique: true },
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
  cvStorage:          String,
  hardSkills:         [{ skill: { type: Schema.Types.ObjectId, ref: 'HardSkill' }, level: Number }],
  softwares:          [{ skill: { type: Schema.Types.ObjectId, ref: 'SoftwareSkill' }, level: Number }],
  softSkills:         [String],
  focusedSkills:      [String],
  languages:          [String],
  workingMode:        String,
  programs:           [String],
  portfolioLinks:     [String],
  professionalExperiences: [{
    jobTitle: String, company: String, locale: String,
    startDate: String, endDate: String,
  }],
  academicTrainings: [{
    establishment: String, locale: String, specialization: String,
    studyLevel: String, startDate: String, endDate: String, isStudent: Boolean,
  }],
  verifiedAccount:   { type: Boolean, default: false },
  verificationCode:  String,
  isTermsAccepted:   Boolean,
  deleted:           { type: Boolean, default: false },
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

export default mongoose.model<IUser>('User', UserSchema);
