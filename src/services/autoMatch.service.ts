import User         from '../models/User';
import Company      from '../models/Company';
import JobOffer     from '../models/JobOffer';
import Application  from '../models/JobOfferApplication';
import Interview    from '../models/Interview';
import Notification from '../models/Notification';
import { rankWithPython }      from './matching.service';
import { sendCompanyProposal } from './email.service';

// ── Smart scheduling ─────────────────────────────────────────
// Find the next free slot for a company, avoiding existing interviews.
// Slots: every 2h from 10:00 to 16:00, Mon–Fri, min 3 days ahead.
const nextSlot = async (companyId: string): Promise<Date> => {
  const existing = await Interview.find({
    companyId,
    status:      'scheduled',
    scheduledAt: { $gte: new Date() },
  }).select('scheduledAt');

  const occupied = new Set(
    existing.map(i => i.scheduledAt.toISOString())
  );

  const candidate = new Date();
  candidate.setDate(candidate.getDate() + 3);
  if (candidate.getDay() === 6) candidate.setDate(candidate.getDate() + 2);
  if (candidate.getDay() === 0) candidate.setDate(candidate.getDate() + 1);
  candidate.setHours(10, 0, 0, 0);
  candidate.setSeconds(0, 0);

  for (let attempts = 0; attempts < 40; attempts++) {
    if (!occupied.has(candidate.toISOString())) return candidate;

    candidate.setHours(candidate.getHours() + 2);
    if (candidate.getHours() > 16) {
      candidate.setDate(candidate.getDate() + 1);
      candidate.setHours(10, 0, 0, 0);
      if (candidate.getDay() === 6) candidate.setDate(candidate.getDate() + 2);
      if (candidate.getDay() === 0) candidate.setDate(candidate.getDate() + 1);
    }
  }
  return candidate; // fallback if all slots are occupied
};

// ── Pipeline ──────────────────────────────────────────────────

interface PipelineOptions {
  jobOfferId?:    string;  // triggered by offer create/update
  applicationId?: string;  // triggered by new application
}

export const runAutoMatchPipeline = async (options: PipelineOptions): Promise<void> => {
  try {
    let applications: any[] = [];
    let offer: any;

    if (options.jobOfferId) {
      offer = await JobOffer.findById(options.jobOfferId)
        .populate('hardSkills.skill',     'name')
        .populate('softwareSkills.skill', 'name');
      if (!offer || offer.status !== 'open') return;

      applications = await Application.find({
        jobOffer: options.jobOfferId,
        deleted:  false,
        status:   1, 
      }).populate({
        path: 'user', select: '-password',
        populate: [
          { path: 'hardSkills.skill', model: 'HardSkill' },
          { path: 'softwares.skill',  model: 'SoftwareSkill' },
        ],
      });

    } else if (options.applicationId) {
      const app = await Application.findById(options.applicationId).populate({
        path: 'user', select: '-password',
        populate: [
          { path: 'hardSkills.skill', model: 'HardSkill' },
          { path: 'softwares.skill',  model: 'SoftwareSkill' },
        ],
      });
      if (!app) return;
      applications = [app];

      offer = await JobOffer.findById(app.jobOffer)
        .populate('hardSkills.skill',     'name')
        .populate('softwareSkills.skill', 'name');
      if (!offer || offer.status !== 'open') return;
    }

    if (!offer || applications.length === 0) return;

    const company      = await Company.findById(offer.company);
    if (!company) return;
    const companyUser  = await User.findById((company as any).owner);
    const companyEmail = companyUser?.email || '';
    const companyName  = (company.name as any)?.fr || (company.name as any)?.en || 'Entreprise';
    const jobTitle     = offer.title || 'Poste';

    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;

    const candidateInputs = applications
      .filter((a: any) => a.user)
      .map((a: any) => {
        const u = a.user;
        return {
          id:         u._id.toString(),
          hardSkills: (u.hardSkills  || []).map((s: any) => ({ skill: s.skill?.name ?? s.skill?.toString() ?? s.skill, level: s.level })),
          softwares:  (u.softwares   || []).map((s: any) => ({ skill: s.skill?.name ?? s.skill?.toString() ?? s.skill, level: s.level })),
          softSkills: u.softSkills  || [],
          cvUrl:      a.cv ? `${backendUrl}/api/Storage/${a.cv}` : undefined,
        };
      });

    if (candidateInputs.length === 0) return;

    // Combine offer text fields for CV semantic comparison
    const offerDescription = [
      offer.title,
      offer.description,
      offer.whoAreThey,
      offer.requiredProfile,
    ].filter(Boolean).join(' ');

    const offerInput = {
      hardSkills:  (offer.hardSkills     || []).map((s: any) => ({ skill: s.skill?.name ?? s.skill?.toString() ?? s.skill, level: s.level })),
      softwares:   (offer.softwareSkills || []).map((s: any) => ({ skill: s.skill?.name ?? s.skill?.toString() ?? s.skill, level: s.level })),
      softSkills:  offer.softSkills || [],
      description: offerDescription || undefined,
    };

    const results = await rankWithPython(offerInput, candidateInputs);

    for (const result of results) {
      const app = applications.find((a: any) => a.user?._id.toString() === result.candidateId);
      if (!app) continue;

      const candidate     = app.user as any;
      const candidateName = (candidate.firstName?.fr || candidate.firstName?.en || candidate.login || '').trim();

      if (result.score < 70) {
        // ── Auto-reject ───────────────────────────────────────
        await Application.findByIdAndUpdate(app._id, {
          status:            2, // Rejected
          matchScore:        result.score,
          skillScore:        result.skillScore,
          semanticScore:     result.semanticScore,
          matchedSkills:     result.matchedSkills,
          missingSkills:     result.missingSkills,
          extractedCvSkills: result.extractedCvSkills,
        });

        await Notification.create({
          userId:  candidate._id,
          type:    'APPLICATION_REJECTED',
          message: `Votre candidature pour "${jobTitle}" n'a pas été retenue (score : ${result.score}%).`,
          data:    { jobOfferId: offer._id },
        });

      } else {
        // ── Retained ──────────────────────────────────────────
        const proposedDate = await nextSlot(company._id.toString());

        await Application.findByIdAndUpdate(app._id, {
          matchScore:        result.score,
          skillScore:        result.skillScore,
          semanticScore:     result.semanticScore,
          proposedDate,
          matchedSkills:     result.matchedSkills,
          missingSkills:     result.missingSkills,
          extractedCvSkills: result.extractedCvSkills,
        });

        // In-app notification to candidate
        await Notification.create({
          userId:  candidate._id,
          type:    'APPLICATION_RETAINED',
          message: `Votre candidature pour "${jobTitle}" est retenue (score : ${result.score}%). L'entreprise va vous contacter.`,
          data:    { jobOfferId: offer._id, score: result.score },
        });

        // Email to company only
        if (companyEmail) {
          await sendCompanyProposal({
            companyEmail,
            companyName,
            candidateName,
            jobTitle,
            score:        result.score,
            proposedDate: proposedDate.toLocaleDateString('fr-FR'),
            proposedTime: proposedDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            frontendUrl:  process.env.FRONTEND_URL!,
          });
        }

        // In-app notification to company
        if (companyUser) {
          await Notification.create({
            userId:  companyUser._id,
            type:    'CANDIDATE_RETAINED',
            message: `Candidature retenue — ${candidateName} pour "${jobTitle}" (score : ${result.score}%)`,
            data:    {
              applicationId:  app._id,
              candidateId:    candidate._id,
              score:          result.score,
              matchedSkills:  result.matchedSkills,
              missingSkills:  result.missingSkills,
            },
          });
        }

      }
    }
  } catch {
    // silently ignore pipeline errors to avoid crashing the server
  }
};
