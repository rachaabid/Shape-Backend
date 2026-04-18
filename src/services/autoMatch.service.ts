import User         from '../models/User';
import Company      from '../models/Company';
import JobOffer     from '../models/JobOffer';
import Application  from '../models/JobOfferApplication';
import Interview    from '../models/Interview';
import Notification from '../models/Notification';
import { rankWithPython } from './matching.service';
import { sendInterviewInvite, sendInterviewConfirmation, sendInterviewReminder } from './email.service';

const MATCH_THRESHOLD     = 60; // score minimum pour créer une candidature automatique
const INTERVIEW_THRESHOLD = 75; // score minimum pour planifier un entretien

// Génère un créneau d'entretien : prochain jour ouvré dans 48h minimum
const nextSlot = (): Date => {
  const date = new Date();
  date.setDate(date.getDate() + 2);
  // Skip weekend
  if (date.getDay() === 6) date.setDate(date.getDate() + 2);
  if (date.getDay() === 0) date.setDate(date.getDate() + 1);
  date.setHours(10, 0, 0, 0);
  return date;
};

// Planifie un rappel email 30 minutes avant l'entretien
const scheduleReminder = (interview: typeof Interview.prototype, candidateEmail: string, companyEmail: string, companyName: string, candidateName: string, jobTitle: string) => {
  const msUntilReminder = new Date(interview.scheduledAt).getTime() - Date.now() - 30 * 60 * 1000;
  if (msUntilReminder <= 0) return;

  setTimeout(async () => {
    try {
      await sendInterviewReminder({
        candidateName, candidateEmail,
        companyName,   companyEmail,
        jobTitle,
        scheduledAt:  interview.scheduledAt,
        channelName:  interview.channelName,
        frontendUrl:  process.env.FRONTEND_URL!,
      });
    } catch (err) {
      console.error('Rappel email error:', err);
    }
  }, msUntilReminder);
};

// ── Pipeline principal ────────────────────────────────────────

interface PipelineOptions {
  jobOfferId?: string;   // déclenché par une offre
  candidateId?: string;  // déclenché par un candidat
}

export const runAutoMatchPipeline = async (options: PipelineOptions): Promise<void> => {
  try {
    let offersToProcess: typeof JobOffer.prototype[] = [];
    let candidatesToProcess: typeof User.prototype[]  = [];

    if (options.jobOfferId) {
      const offer = await JobOffer.findById(options.jobOfferId);
      if (!offer || offer.status !== 'open') return;
      offersToProcess = [offer];

      // Tous les candidats actifs
      candidatesToProcess = await User.find({ roles: 'CANDIDATE', deleted: false, verifiedAccount: true });

    } else if (options.candidateId) {
      const candidate = await User.findById(options.candidateId);
      if (!candidate) return;
      candidatesToProcess = [candidate];

      // Toutes les offres ouvertes
      offersToProcess = await JobOffer.find({ status: 'open', deleted: false });
    }

    for (const offer of offersToProcess) {
      // Récupérer l'entreprise de l'offre
      const company     = await Company.findById(offer.company);
      if (!company) continue;
      const companyUser = await User.findById(company.owner);

      const candidateInputs = candidatesToProcess.map(c => ({
        id:         c._id.toString(),
        hardSkills: c.hardSkills  || [],
        softwares:  c.softwares   || [],
        softSkills: c.softSkills  || [],
      }));

      const results = await rankWithPython(
        { hardSkills: offer.hardSkills, softwares: offer.softwareSkills, softSkills: offer.softSkills },
        candidateInputs
      );

      for (const result of results) {
        if (result.score < MATCH_THRESHOLD) continue;

        const candidate = candidatesToProcess.find(c => c._id.toString() === result.candidateId);
        if (!candidate) continue;

        // Créer ou mettre à jour la candidature
        const existingApp = await Application.findOne({ user: candidate._id, jobOffer: offer._id });
        let application = existingApp;

        if (!existingApp) {
          application = await Application.create({
            user:        candidate._id,
            jobOffer:    offer._id,
            status:      1, // Received
            matchScore:  result.score,
            coverLetter: `Candidature automatique — Score de matching : ${result.score}%`,
          });
        } else {
          await Application.findByIdAndUpdate(existingApp._id, { matchScore: result.score });
        }

        // Notification au candidat
        await Notification.create({
          userId:  candidate._id,
          type:    'NEW_MATCH',
          message: `Nouvelle offre correspondant à votre profil (${result.score}%) : ${offer.title}`,
          data:    { jobOfferId: offer._id, score: result.score },
        });

        // Planifier entretien si score suffisant et pas déjà planifié
        if (result.score >= INTERVIEW_THRESHOLD && application) {
          const existingInterview = await Interview.findOne({
            applicationId: application._id,
            status: 'scheduled',
          });
          if (existingInterview) continue;

          const scheduledAt   = nextSlot();
          const channelName   = `shape-interview-${offer._id}-${candidate._id}-${Date.now()}`;

          const interview = await Interview.create({
            applicationId: application._id,
            companyId:     company._id,
            candidateId:   candidate._id,
            jobOfferId:    offer._id,
            scheduledAt,
            channelName,
            status: 'scheduled',
          });

          // Mettre à jour le statut de la candidature → InProgress
          await Application.findByIdAndUpdate(application._id, { status: 2 });

          const candidateName = `${candidate.firstName?.fr || candidate.login}`;
          const companyName   = company.name?.fr || 'Entreprise';
          const companyEmail  = companyUser?.email || '';
          const jobTitle      = offer.title || 'Poste';

          // Email invitation au candidat
          await sendInterviewInvite({
            candidateName, candidateEmail: candidate.email,
            companyName,   companyEmail,
            jobTitle, scheduledAt, channelName,
            frontendUrl: process.env.FRONTEND_URL!,
          });

          // Email confirmation à l'entreprise
          await sendInterviewConfirmation({
            candidateName, candidateEmail: candidate.email,
            companyName,   companyEmail,
            jobTitle, scheduledAt, channelName,
            frontendUrl: process.env.FRONTEND_URL!,
          });

          // Notification à l'entreprise
          if (companyUser) {
            await Notification.create({
              userId:  companyUser._id,
              type:    'INTERVIEW_SCHEDULED',
              message: `Entretien planifié avec ${candidateName} pour : ${jobTitle}`,
              data:    { interviewId: interview._id, candidateId: candidate._id },
            });
          }

          // Rappel automatique 30 min avant
          scheduleReminder(interview, candidate.email, companyEmail, companyName, candidateName, jobTitle);

          console.log(`✅ Entretien planifié — ${candidateName} × ${jobTitle} (score: ${result.score}%)`);
        }
      }
    }
  } catch (err) {
    console.error('AutoMatch pipeline error:', err);
  }
};
