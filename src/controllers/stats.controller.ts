import { Request, Response } from 'express';
import User from '../models/User';
import JobOffer from '../models/JobOffer';
import Application from '../models/JobOfferApplication';
import Interview from '../models/Interview';
import Program from '../models/Program';
import Inscription from '../models/Inscription';
import ProgramRequest from '../models/ProgramRequest';
import Task from '../models/Task';
import TaskResponse from '../models/TaskResponse';
import MentorEvaluation from '../models/MentorEvaluation';

export const getStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekEnd    = new Date(now.getTime() + 7 * 86_400_000);

    const [
      totalUsers, totalCandidates, totalCompanies, totalMentors, newThisMonth,
      pendingValidation,
      totalOffers, openOffers,
      totalApplications, retainedApps, rejectedApps, hiredApps,
      totalInterviews, scheduledInterviews, cancelledInterviews, upcomingInterviews,
      totalPrograms, onlinePrograms,
      totalInscriptions, completedInscriptions,
      pendingProgramRequests,
      totalTasks, openTasks, inProgressTasks, reviewTasks, doneTasks,
      activeMentors,
      scoreAgg, evalScoreAgg,
      byMonthAgg, registrationsByMonthAgg,
      missingSkillsAgg, scoreDistAgg, countryAgg, topProgramsAgg,
    ] = await Promise.all([
      User.countDocuments({ deleted: false }),
      User.countDocuments({ roles: 'CANDIDATE', deleted: false }),
      User.countDocuments({ roles: 'COMPANY', deleted: false }),
      User.countDocuments({ roles: 'MENTOR', deleted: false }),
      User.countDocuments({ createdAt: { $gte: monthStart }, deleted: false }),
      // Comptes en attente de validation (candidat/entreprise non vérifiés)
      User.countDocuments({ roles: { $in: ['CANDIDATE', 'COMPANY'] }, verifiedAccount: false, deleted: false }),

      JobOffer.countDocuments({ deleted: false }),
      JobOffer.countDocuments({ status: 'open', deleted: false }),

      Application.countDocuments({ deleted: false }),
      Application.countDocuments({ status: 3, deleted: false }),
      Application.countDocuments({ status: 2, deleted: false }),
      Application.countDocuments({ status: 4, deleted: false }),

      Interview.countDocuments(),
      Interview.countDocuments({ status: 'scheduled' }),
      Interview.countDocuments({ status: 'cancelled' }),
      Interview.countDocuments({ status: 'scheduled', scheduledAt: { $gte: now, $lte: weekEnd } }),

      Program.countDocuments({ deleted: false }),
      Program.countDocuments({ online: true, deleted: false }),

      Inscription.countDocuments({ deleted: { $ne: true } }),
      Inscription.countDocuments({ status: 'completed', deleted: { $ne: true } }),

      ProgramRequest.countDocuments({ status: 'pending', deleted: { $ne: true } }),

      Task.countDocuments({ deleted: { $ne: true } }),
      TaskResponse.countDocuments({ status: 0, deleted: { $ne: true } }),
      TaskResponse.countDocuments({ status: 1, deleted: { $ne: true } }),
      TaskResponse.countDocuments({ status: 2, deleted: { $ne: true } }),
      TaskResponse.countDocuments({ status: 3, deleted: { $ne: true } }),

      // Mentors actifs = ayant au moins une inscription assignée
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
          _id: 0,
          range: { $switch: { branches: [
            { case: { $eq: ['$_id', 0]  }, then: '0–30'   },
            { case: { $eq: ['$_id', 30] }, then: '30–50'  },
            { case: { $eq: ['$_id', 50] }, then: '50–70'  },
            { case: { $eq: ['$_id', 70] }, then: '70–85'  },
            { case: { $eq: ['$_id', 85] }, then: '85–100' },
          ], default: 'other' } },
          count: 1,
        }},
      ]),

      // Répartition géographique des candidats
      User.aggregate<{ country: string; count: number }>([
        { $match: { roles: 'CANDIDATE', deleted: false, country: { $exists: true, $ne: null } } },
        { $group: { _id: '$country', count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 8 },
        { $project: { _id: 0, country: '$_id', count: 1 } },
      ]),

      // Programmes les plus suivis (via inscriptions)
      Inscription.aggregate<{ program: any; count: number }>([
        { $match: { deleted: { $ne: true } } },
        { $unwind: '$programs' },
        { $group: { _id: '$programs', count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 5 },
        { $lookup: { from: 'programs', localField: '_id', foreignField: '_id', as: 'prog' } },
        { $project: {
          _id: 0, count: 1,
          title: { $ifNull: [{ $arrayElemAt: ['$prog.title.fr', 0] }, 'Programme'] },
        }},
      ]),
    ]);

    const avgScore = Array.isArray(scoreAgg) && scoreAgg.length
      ? Math.round(scoreAgg[0].avg || 0) : 0;
    const avgEvalScore = Array.isArray(evalScoreAgg) && evalScoreAgg.length
      ? Math.round((evalScoreAgg[0].avg || 0) * 10) / 10 : 0;
    const retentionRate = totalApplications > 0
      ? Math.round((retainedApps / totalApplications) * 100) : 0;
    const conversionRate = totalApplications > 0
      ? Math.round((hiredApps / totalApplications) * 100) : 0;
    const completionRate = totalInscriptions > 0
      ? Math.round((completedInscriptions / totalInscriptions) * 100) : 0;

    res.json({
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
        programs: totalPrograms, onlinePrograms,
        inscriptions: totalInscriptions, completedInscriptions, completionRate,
        pendingProgramRequests,
        tasks: { total: totalTasks, open: openTasks, inProgress: inProgressTasks, review: reviewTasks, done: doneTasks },
        activeMentors, avgEvalScore,
      },
      programs: totalPrograms,
      byMonth:           Array.isArray(byMonthAgg)             ? byMonthAgg             : [],
      registrations:     Array.isArray(registrationsByMonthAgg) ? registrationsByMonthAgg : [],
      missingSkills:     Array.isArray(missingSkillsAgg)        ? missingSkillsAgg        : [],
      scoreDist:         Array.isArray(scoreDistAgg)            ? scoreDistAgg            : [],
      countries:         Array.isArray(countryAgg)             ? countryAgg             : [],
      topPrograms:       Array.isArray(topProgramsAgg)         ? topProgramsAgg         : [],
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};
