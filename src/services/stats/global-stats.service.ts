/**
 * Agrégations "dashboard" — état actuel global de la plateforme.
 * Retourne des nombres bruts ; le contrôleur les assemble en réponse JSON.
 */
import User from '../../models/User';
import JobOffer from '../../models/JobOffer';
import Application from '../../models/JobOfferApplication';
import Interview from '../../models/Interview';
import Training from '../../models/Training';
import Inscription from '../../models/Inscription';
import TrainingRequest from '../../models/TrainingRequest';
import Task from '../../models/Task';
import MentorEvaluation from '../../models/MentorEvaluation';

const TASK_STATUS = { OPEN: 0, IN_PROGRESS: 1, REVIEW: 2, DONE: 3 } as const;
const APP_STATUS  = { RETAINED: 2, REJECTED: 3, HIRED: 4 } as const;

/** Compte les réponses (Task.responses[]) ayant un statut donné. */
function countResponsesByStatus(status: number): Promise<number> {
  return Task.aggregate([
    { $match: { deleted: { $ne: true } } },
    { $unwind: '$responses' },
    { $match: { 'responses.deleted': { $ne: true }, 'responses.status': status } },
    { $count: 'n' },
  ]).then((r: any[]) => r[0]?.n || 0);
}

export interface GlobalStats {
  users: {
    total: number; candidates: number; companies: number; mentors: number;
    newThisMonth: number; pendingValidation: number;
  };
  offers: { total: number; open: number; closed: number };
  applications: {
    total: number; pending: number; retained: number; rejected: number; hired: number;
    retentionRate: number; conversionRate: number; avgMatchScore: number;
  };
  interviews: { total: number; scheduled: number; completed: number; cancelled: number; upcoming: number };
  formation: {
    trainings: number; onlineTrainings: number;
    inscriptions: number; completedInscriptions: number; completionRate: number;
    pendingTrainingRequests: number;
    tasks: { total: number; open: number; inProgress: number; review: number; done: number };
    activeMentors: number; avgEvalScore: number;
  };
  trainings: number;
  byMonth:       { month: string; count: number }[];
  registrations: { month: string; count: number }[];
  missingSkills: { skill: string; count: number }[];
  scoreDist:     { range: string; count: number }[];
  countries:     { country: string; count: number }[];
  topTrainings:   { title: string; count: number }[];
}

export async function buildGlobalStats(): Promise<GlobalStats> {
  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekEnd    = new Date(now.getTime() + 7 * 86_400_000);

  const [
    totalUsers, totalCandidates, totalCompanies, totalMentors, newThisMonth,
    pendingValidation,
    totalOffers, openOffers,
    totalApplications, retainedApps, rejectedApps, hiredApps,
    totalInterviews, scheduledInterviews, cancelledInterviews, upcomingInterviews,
    totalTrainings, onlineTrainings,
    totalInscriptions, completedInscriptions,
    pendingTrainingRequests,
    totalTasks, openTasks, inProgressTasks, reviewTasks, doneTasks,
    activeMentors,
    scoreAgg, evalScoreAgg,
    byMonthAgg, registrationsByMonthAgg,
    missingSkillsAgg, scoreDistAgg, countryAgg, topTrainingsAgg,
  ] = await Promise.all([
    User.countDocuments({ deleted: false }),
    User.countDocuments({ roles: 'CANDIDATE', deleted: false }),
    User.countDocuments({ roles: 'COMPANY',   deleted: false }),
    User.countDocuments({ roles: 'MENTOR',    deleted: false }),
    User.countDocuments({ createdAt: { $gte: monthStart }, deleted: false }),
    User.countDocuments({
      roles: { $in: ['CANDIDATE', 'COMPANY'] },
      verifiedAccount: false, deleted: false,
    }),

    JobOffer.countDocuments({ deleted: false }),
    JobOffer.countDocuments({ status: 'open', deleted: false }),

    Application.countDocuments({ deleted: false }),
    Application.countDocuments({ status: APP_STATUS.RETAINED, deleted: false }),
    Application.countDocuments({ status: APP_STATUS.REJECTED, deleted: false }),
    Application.countDocuments({ status: APP_STATUS.HIRED,    deleted: false }),

    Interview.countDocuments(),
    Interview.countDocuments({ status: 'scheduled' }),
    Interview.countDocuments({ status: 'cancelled' }),
    Interview.countDocuments({ status: 'scheduled', scheduledAt: { $gte: now, $lte: weekEnd } }),

    Training.countDocuments({ deleted: false }),
    Training.countDocuments({ online: true, deleted: false }),

    Inscription.countDocuments({ deleted: { $ne: true } }),
    Inscription.countDocuments({ status: 'completed', deleted: { $ne: true } }),

    // Le badge dashboard doit refleter la file active : on exclut aussi les
    // demandes archivees, sinon le compteur reste eleve apres archivage et
    // la liste backoffice (qui filtre archived) affiche un autre nombre.
    TrainingRequest.countDocuments({ status: 'pending', archived: { $ne: true }, deleted: { $ne: true } }),

    Task.countDocuments({ deleted: { $ne: true } }),
    countResponsesByStatus(TASK_STATUS.OPEN),
    countResponsesByStatus(TASK_STATUS.IN_PROGRESS),
    countResponsesByStatus(TASK_STATUS.REVIEW),
    countResponsesByStatus(TASK_STATUS.DONE),

    Inscription.distinct('mentor', { mentor: { $ne: null }, deleted: { $ne: true } })
      .then((ids: any[]) => ids.length),

    Application.aggregate<{ avg: number }>([
      { $match: { matchScore: { $exists: true, $ne: null }, deleted: false } },
      { $group: { _id: null, avg: { $avg: '$matchScore' } } },
    ]),

    MentorEvaluation.aggregate<{ avg: number }>([
      { $match: { deleted: { $ne: true } } },
      { $group: { _id: null, avg: { $avg: '$globalScore' } } },
    ]),

    Application.aggregate<{ month: string; count: number }>([
      { $match: { deleted: false, createdAt: { $exists: true } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }, { $limit: 12 },
      { $project: { _id: 0, month: '$_id', count: 1 } },
    ]),

    User.aggregate<{ month: string; count: number }>([
      { $match: { deleted: false, createdAt: { $exists: true } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }, { $limit: 12 },
      { $project: { _id: 0, month: '$_id', count: 1 } },
    ]),

    Application.aggregate<{ skill: string; count: number }>([
      { $match: { deleted: false, missingSkills: { $exists: true, $ne: [] } } },
      { $unwind: '$missingSkills' },
      { $group: { _id: '$missingSkills', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 8 },
      { $project: { _id: 0, skill: '$_id', count: 1 } },
    ]),

    Application.aggregate<{ range: string; count: number }>([
      { $match: { deleted: false, matchScore: { $exists: true, $ne: null } } },
      { $bucket: {
        groupBy: '$matchScore',
        boundaries: [0, 30, 50, 70, 85, 101],
        default: 'other',
        output: { count: { $sum: 1 } },
      }},
      { $project: {
        _id: 0, count: 1,
        range: { $switch: { branches: [
          { case: { $eq: ['$_id', 0]  }, then: '0–30'   },
          { case: { $eq: ['$_id', 30] }, then: '30–50'  },
          { case: { $eq: ['$_id', 50] }, then: '50–70'  },
          { case: { $eq: ['$_id', 70] }, then: '70–85'  },
          { case: { $eq: ['$_id', 85] }, then: '85–100' },
        ], default: 'other' } },
      }},
    ]),

    User.aggregate<{ country: string; count: number }>([
      { $match: { roles: 'CANDIDATE', deleted: false, country: { $exists: true, $ne: null } } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 8 },
      { $project: { _id: 0, country: '$_id', count: 1 } },
    ]),

    Inscription.aggregate<{ title: string; count: number }>([
      { $match: { deleted: { $ne: true } } },
      { $unwind: '$trainings' },
      { $group: { _id: '$trainings', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 5 },
      { $lookup: { from: 'trainings', localField: '_id', foreignField: '_id', as: 'prog' } },
      { $project: {
        _id: 0, count: 1,
        title: { $ifNull: [{ $arrayElemAt: ['$prog.title.fr', 0] }, 'Programme'] },
      }},
    ]),
  ]);

  const avgScore       = Array.isArray(scoreAgg)     && scoreAgg.length     ? Math.round(scoreAgg[0].avg     || 0) : 0;
  const avgEvalScore   = Array.isArray(evalScoreAgg) && evalScoreAgg.length ? Math.round((evalScoreAgg[0].avg || 0) * 10) / 10 : 0;
  const retentionRate  = totalApplications > 0 ? Math.round((retainedApps  / totalApplications) * 100) : 0;
  const conversionRate = totalApplications > 0 ? Math.round((hiredApps     / totalApplications) * 100) : 0;
  const completionRate = totalInscriptions > 0 ? Math.round((completedInscriptions / totalInscriptions) * 100) : 0;

  return {
    users: {
      total: totalUsers, candidates: totalCandidates,
      companies: totalCompanies, mentors: totalMentors,
      newThisMonth, pendingValidation,
    },
    offers: { total: totalOffers, open: openOffers, closed: totalOffers - openOffers },
    applications: {
      total: totalApplications,
      pending: Math.max(0, totalApplications - retainedApps - rejectedApps - hiredApps),
      retained: retainedApps, rejected: rejectedApps, hired: hiredApps,
      retentionRate, conversionRate, avgMatchScore: avgScore,
    },
    interviews: {
      total: totalInterviews, scheduled: scheduledInterviews,
      completed: Math.max(0, totalInterviews - scheduledInterviews - cancelledInterviews),
      cancelled: cancelledInterviews, upcoming: upcomingInterviews,
    },
    formation: {
      trainings: totalTrainings, onlineTrainings,
      inscriptions: totalInscriptions, completedInscriptions, completionRate,
      pendingTrainingRequests,
      tasks: {
        total: totalTasks, open: openTasks,
        inProgress: inProgressTasks, review: reviewTasks, done: doneTasks,
      },
      activeMentors, avgEvalScore,
    },
    trainings:      totalTrainings,
    byMonth:       Array.isArray(byMonthAgg)              ? byMonthAgg              : [],
    registrations: Array.isArray(registrationsByMonthAgg) ? registrationsByMonthAgg : [],
    missingSkills: Array.isArray(missingSkillsAgg)        ? missingSkillsAgg        : [],
    scoreDist:     Array.isArray(scoreDistAgg)            ? scoreDistAgg            : [],
    countries:     Array.isArray(countryAgg)              ? countryAgg              : [],
    topTrainings:   Array.isArray(topTrainingsAgg)          ? topTrainingsAgg          : [],
  };
}
