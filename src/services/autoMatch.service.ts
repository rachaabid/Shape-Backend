import User         from '../models/User';
import Company      from '../models/Company';
import JobOffer     from '../models/JobOffer';
import Application  from '../models/JobOfferApplication';
import Interview    from '../models/Interview';
import Notification from '../models/Notification';
import { rankWithPython }      from './matching.service';
import { sendCompanyProposal } from './email.service';

// Extract a plain string from a potentially multilingual skill name object
const getSkillName = (s: any): string => {
  const n = s.skill?.name;
  if (!n) return s.skill?.toString?.() ?? '';
  if (typeof n === 'string') return n;
  return n.fr || n.en || n.ar || s.skill?.toString?.() || '';
};

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

      // Auto-create status-0 (auto-suggested) applications for candidates without one
      const allCandidateIds = (await User.find({ roles: 'CANDIDATE', deleted: { $ne: true } }).select('_id'))
        .map((u: any) => u._id.toString());

      const existingUserIds = new Set(
        (await Application.find({ jobOffer: options.jobOfferId, deleted: false }).distinct('user'))
          .map((id: any) => id.toString())
      );

      const newApps = allCandidateIds
        .filter(id => !existingUserIds.has(id))
        .map(userId => ({ user: userId, jobOffer: options.jobOfferId, status: 0 }));

      if (newApps.length > 0) await Application.insertMany(newApps);

      // Match all pending: auto-suggested (0) + manually applied (1)
      applications = await Application.find({
        jobOffer: options.jobOfferId,
        deleted:  false,
        status:   { $in: [0, 1] },
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

    if (!offer || applications.length === 0) {
      console.log('[autoMatch] no offer or no applications, aborting');
      return;
    }

    console.log(`[autoMatch] offer="${offer.title}" | ${applications.length} candidate(s) to score`);

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
          hardSkills: (u.hardSkills || []).map((s: any) => ({ skill: getSkillName(s), level: s.level ?? 1 })).filter((s: any) => s.skill),
          softwares:  (u.softwares  || []).map((s: any) => ({ skill: getSkillName(s), level: s.level ?? 1 })).filter((s: any) => s.skill),
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
  ].filter(Boolean).join(' ').toLowerCase();

    const offerInput = {
      hardSkills:  (offer.hardSkills     || []).map((s: any) => ({ skill: getSkillName(s), level: s.level ?? 1 })).filter((s: any) => s.skill),
      softwares:   (offer.softwareSkills || []).map((s: any) => ({ skill: getSkillName(s), level: s.level ?? 1 })).filter((s: any) => s.skill),
      softSkills:  offer.softSkills || [],
      description: offerDescription || undefined,
    };

    console.log(`[autoMatch] offerSkills: ${offerInput.hardSkills.slice(0,3).map((s:any)=>s.skill).join(', ')}`);
    console.log(`[autoMatch] sample candidate skills: ${candidateInputs[0]?.hardSkills?.slice(0,2).map((s:any)=>s.skill).join(', ') || 'none'}`);

    const results = await rankWithPython(offerInput, candidateInputs);

    console.log(`[autoMatch] top 5 scores: ${results.slice(0,5).map(r => `${r.candidateId.slice(-4)}→${r.score}`).join(' | ')}`);

    for (const result of results) {
      const app = applications.find((a: any) => a.user?._id.toString() === result.candidateId);
      if (!app) continue;

      const isRealApplication = (app.status ?? 0) === 1;
      const candidate     = app.user as any;
      const candidateName = (candidate.firstName?.fr || candidate.firstName?.en || candidate.login || '').trim();

      const scoreUpdate = {
        matchScore:        result.score,
        skillScore:        result.skillScore,
        semanticScore:     result.semanticScore,
        matchedSkills:     result.matchedSkills,
        missingSkills:     result.missingSkills,
        extractedCvSkills: result.extractedCvSkills,
      };

      if (result.score < 70) {
        if (isRealApplication) {
          // ── Auto-reject real application ──────────────────────
          await Application.findByIdAndUpdate(app._id, { ...scoreUpdate, status: 2 });
          await Notification.create({
            userId:  candidate._id,
            type:    'APPLICATION_REJECTED',
            message: `Votre candidature pour "${jobTitle}" n'a pas été retenue (score : ${result.score}%).`,
            data:    { jobOfferId: offer._id },
          });
        } else {
          // ── Low-score auto-suggestion: store score silently ────
          await Application.findByIdAndUpdate(app._id, scoreUpdate);
        }
      } else {
        // ── Score >= 70 ───────────────────────────────────────────
        if (isRealApplication) {
          const proposedDate = await nextSlot(company._id.toString());
          await Application.findByIdAndUpdate(app._id, { ...scoreUpdate, proposedDate });

          await Notification.create({
            userId:  candidate._id,
            type:    'APPLICATION_RETAINED',
            message: `Votre candidature pour "${jobTitle}" est retenue (score : ${result.score}%). L'entreprise va vous contacter.`,
            data:    { jobOfferId: offer._id, score: result.score },
          });

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
        } else {
          // ── Good auto-suggestion: store score, notify company only ──
          await Application.findByIdAndUpdate(app._id, scoreUpdate);
        }

        // In-app notification to company for both cases
        if (companyUser) {
          await Notification.create({
            userId:  companyUser._id,
            type:    'CANDIDATE_RETAINED',
            message: isRealApplication
              ? `Candidature retenue — ${candidateName} pour "${jobTitle}" (score : ${result.score}%)`
              : `Profil compatible — ${candidateName} pour "${jobTitle}" (score : ${result.score}%)`,
            data: {
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
  } catch (err) {
    console.error('[autoMatch] pipeline error:', err);
  }
};

// Triggered when a new CANDIDATE registers: match against all open offers
export const triggerMatchForNewCandidate = async (candidateId: string): Promise<void> => {
  try {
    const openOffers = await JobOffer.find({ status: 'open', deleted: { $ne: true } }).select('_id');
    for (const offer of openOffers) {
      let app = await Application.findOne({
        user:     candidateId,
        jobOffer: offer._id,
        deleted:  false,
        status:   { $in: [0, 1] },
      });
      if (!app) {
        app = await Application.create({ user: candidateId, jobOffer: offer._id, status: 0 });
      }
      await runAutoMatchPipeline({ applicationId: app._id.toString() });
    }
  } catch (err) {
    console.error('[autoMatch] triggerMatchForNewCandidate error:', err);
  }
};
