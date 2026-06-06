import User             from '../models/User';
import JobOffer         from '../models/JobOffer';
import Application      from '../models/JobOfferApplication';
import Interview        from '../models/Interview';
import Notification     from '../models/Notification';
import Quiz             from '../models/Quiz';
import Task             from '../models/Task';
import MentorEvaluation from '../models/MentorEvaluation';
import { sendCompanyProposal } from './email.service';
import axios from 'axios';

// ── Matching interfaces ───────────────────────────────────────
export interface SkillVector  { skill: string; level: number; }
export interface MatchResult  {
  candidateId:        string;
  score:              number;
  skillScore?:        number;
  semanticScore?:     number;
  matchedSkills:      string[];
  missingSkills:      string[];
  extractedCvSkills?: string[];
}
export interface JobOfferSkills {
  hardSkills:   SkillVector[];
  softwares:    SkillVector[];
  softSkills:   string[];
  description?: string;
}
export interface CandidateSkills {
  id:         string;
  hardSkills: SkillVector[];
  softwares:  SkillVector[];
  softSkills: string[];
  cvUrl?:     string;
}

const rankWithPython = async (
  offer: JobOfferSkills,
  candidates: CandidateSkills[]
): Promise<MatchResult[]> => {
  const { data } = await axios.post(`${process.env.PYTHON_SERVICE_URL}/match`, { offer, candidates });
  return data.results;
};

// Extract a plain string from a potentially multilingual skill name object
const getSkillName = (s: any): string => {
  const n = s.skill?.name;
  if (!n) return s.skill?.toString?.() ?? '';
  if (typeof n === 'string') return n;
  return n.fr || n.en || n.ar || s.skill?.toString?.() || '';
};

// ── Enhanced scoring helpers ──────────────────────────────────
// Compute quiz score (0-100) for a list of candidates in one DB round
const computeQuizScoresForCandidates = async (ids: string[]): Promise<Record<string, number>> => {
  if (ids.length === 0) return {};
  // Réponses imbriquées dans Quiz.responses[] : on aplatit en attachant le quiz parent.
  const idSet = new Set(ids.map(String));
  const quizzes = await Quiz.find({ deleted: { $ne: true } });
  const responses: any[] = [];
  quizzes.forEach(q => (q.responses || []).forEach((r: any) => {
    if (!r.deleted && idSet.has(String(r.owner))) {
      responses.push({ owner: r.owner, quiz: q, reponses: r.reponses });
    }
  }));

  const scoreMap: Record<string, { got: number; max: number }> = {};
  for (const resp of responses) {
    const ownerId = resp.owner?.toString();
    if (!ownerId) continue;
    const quiz = resp.quiz as any;
    if (!quiz?.sections) continue;

    const allQuestions = quiz.sections.flatMap((s: any) => s.questions ?? []);
    const optionScore  = new Map<string, number>(
      allQuestions.flatMap((q: any) => (q.options ?? []).map((o: any) => [o._id.toString(), o.score ?? 0]))
    );
    const maxScore = allQuestions.reduce((s: number, q: any) => {
      const scores = (q.options ?? []).map((o: any) => o.score ?? 0);
      return s + (scores.length ? Math.max(...scores) : 0);
    }, 0);
    const gotScore = (resp.reponses ?? []).reduce((s: number, qr: any) => {
      return s + (qr.options ?? []).reduce((s2: number, optId: any) => {
        return s2 + (optionScore.get(optId.toString()) ?? 0);
      }, 0);
    }, 0);

    if (!scoreMap[ownerId]) scoreMap[ownerId] = { got: 0, max: 0 };
    scoreMap[ownerId].got += gotScore;
    scoreMap[ownerId].max += maxScore;
  }

  const result: Record<string, number> = {};
  for (const id of ids) {
    const s = scoreMap[id];
    result[id] = s && s.max > 0 ? Math.round((s.got / s.max) * 100) : 0;
  }
  return result;
};

const computeTaskScoresForCandidates = async (ids: string[]): Promise<Record<string, number>> => {
  if (ids.length === 0) return {};
  const idSet = new Set(ids.map(String));
  const tasks = await Task.find({ deleted: { $ne: true } });
  const responses: any[] = [];
  tasks.forEach(t => (t.responses || []).forEach((r: any) => {
    if (!r.deleted && idSet.has(String(r.owner))) responses.push(r);
  }));
  const map: Record<string, { total: number; closed: number }> = {};
  for (const r of responses) {
    const ownerId = r.owner?.toString();
    if (!ownerId) continue;
    if (!map[ownerId]) map[ownerId] = { total: 0, closed: 0 };
    map[ownerId].total++;
    if (r.status === 3) map[ownerId].closed++;
  }
  const result: Record<string, number> = {};
  for (const id of ids) {
    const s = map[id];
    result[id] = s && s.total > 0 ? Math.round((s.closed / s.total) * 100) : 0;
  }
  return result;
};

const computeMentorScoresForCandidates = async (ids: string[]): Promise<Record<string, number>> => {
  if (ids.length === 0) return {};
  const evals = await MentorEvaluation.find({ intern: { $in: ids }, deleted: { $ne: true } });
  const map: Record<string, { sum: number; count: number }> = {};
  for (const e of evals) {
    const id = e.intern.toString();
    if (!map[id]) map[id] = { sum: 0, count: 0 };
    map[id].sum   += e.globalScore;
    map[id].count += 1;
  }
  const result: Record<string, number> = {};
  for (const id of ids) {
    const s = map[id];
    // globalScore is 0-10, convert to 0-100
    result[id] = s && s.count > 0 ? Math.round((s.sum / s.count) * 10) : 0;
  }
  return result;
};

const computeBehaviorScoresForCandidates = async (ids: string[]): Promise<Record<string, number>> => {
  if (ids.length === 0) return {};
  const users = await User.find({ _id: { $in: ids } });
  const result: Record<string, number> = {};
  for (const u of users) {
    let score = 0;
    const ua = u as any;
    const cp = ua.candidateProfile || {};
    if (cp.hardSkills?.length > 0) score += 25;
    if (cp.softSkills?.length > 0) score += 25;
    if (cp.softwares?.length  > 0) score += 25;
    if (cp.cvStorage || ua.cvUrl || ua.cv) score += 25;
    result[u._id.toString()] = score;
  }
  return result;
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
          { path: 'candidateProfile.hardSkills.skill', model: 'Skill' },
          { path: 'candidateProfile.softwares.skill',  model: 'Skill' },
        ],
      });

    } else if (options.applicationId) {
      const app = await Application.findById(options.applicationId).populate({
        path: 'user', select: '-password',
        populate: [
          { path: 'candidateProfile.hardSkills.skill', model: 'Skill' },
          { path: 'candidateProfile.softwares.skill',  model: 'Skill' },
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

    // L'entreprise est désormais un User (rôle COMPANY) : offer.company == User._id.
    const companyUser  = await User.findById(offer.company);
    if (!companyUser) return;
    const companyEmail = companyUser.email || '';
    const cName        = (companyUser.companyProfile as any)?.companyName;
    const companyName  = cName?.fr || cName?.en || 'Entreprise';
    const jobTitle     = offer.title || 'Poste';

    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;

    const candidateInputs = applications
      .filter((a: any) => a.user)
      .map((a: any) => {
        const u = a.user;
        const cp = u.candidateProfile || {};
        return {
          id:         u._id.toString(),
          hardSkills: (cp.hardSkills || []).map((s: any) => ({ skill: getSkillName(s), level: s.level ?? 1 })).filter((s: any) => s.skill),
          softwares:  (cp.softwares  || []).map((s: any) => ({ skill: getSkillName(s), level: s.level ?? 1 })).filter((s: any) => s.skill),
          softSkills: cp.softSkills  || [],
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

    const results = await rankWithPython(offerInput, candidateInputs);

    // ── Enhanced multi-factor scoring ─────────────────────────────────────────
    // Formula: 30% skills + 20% quiz + 25% tasks + 15% mentor + 10% behavior
    const candidateIds = candidateInputs.map(c => c.id);
    const [quizScores, taskScores, mentorScores, behaviorScores] = await Promise.all([
      computeQuizScoresForCandidates(candidateIds),
      computeTaskScoresForCandidates(candidateIds),
      computeMentorScoresForCandidates(candidateIds),
      computeBehaviorScoresForCandidates(candidateIds),
    ]);

    for (const r of results) {
      const skillScore    = r.score;                                // 0-100 from Python
      const quizScore     = quizScores[r.candidateId]    ?? 0;
      const taskScore     = taskScores[r.candidateId]    ?? 0;
      const mentorScore   = mentorScores[r.candidateId]  ?? 0;
      const behaviorScore = behaviorScores[r.candidateId] ?? 0;

      r.score      = Math.min(100, Math.round(
        skillScore * 0.30 + quizScore * 0.20 + taskScore * 0.25 + mentorScore * 0.15 + behaviorScore * 0.10
      ));
      r.skillScore = skillScore / 100; // keep raw skill fraction for display
    }

    // Re-sort after enhanced scoring
    results.sort((a, b) => b.score - a.score);

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
          const proposedDate = await nextSlot(companyUser._id.toString());
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
