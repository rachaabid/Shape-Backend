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

/**
 * Statistiques BI enrichies : période ajustable + delta vs période précédente.
 * GET /api/stats/bi
 *   ?period=30d|7d|90d|year       — période prédéfinie
 *   ?from=YYYY-MM-DD&to=YYYY-MM-DD — plage personnalisée (prioritaire)
 *
 * Renvoie pour chaque KPI : value, previous, delta (%) et la série temporelle
 * jour-par-jour (utilisable pour un graph line/area).
 */
export const getBiStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const fromParam = req.query['from'] ? String(req.query['from']) : '';
    const toParam   = req.query['to']   ? String(req.query['to'])   : '';
    const useCustom = !!(fromParam && toParam);

    const period = useCustom ? 'custom' : String(req.query['period'] || '30d');

    let periodStart: Date;
    let periodEnd:   Date;

    if (useCustom) {
      periodStart = new Date(fromParam);
      // borne supérieure exclusive : on prend la fin de journée du `to`
      periodEnd = new Date(toParam);
      periodEnd.setHours(23, 59, 59, 999);
      if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime()) || periodStart > periodEnd) {
        res.status(400).json({ message: 'Plage de dates invalide.' });
        return;
      }
    } else {
      const days = period === '7d' ? 7
                : period === '90d' ? 90
                : period === 'year' ? 365
                : 30;
      periodEnd   = new Date();
      periodStart = new Date(periodEnd.getTime() - days * 86_400_000);
    }

    const spanMs    = periodEnd.getTime() - periodStart.getTime();
    const days      = Math.max(1, Math.round(spanMs / 86_400_000));
    const prevStart = new Date(periodStart.getTime() - spanMs);
    const dayFormat = days <= 31 ? '%Y-%m-%d' : '%Y-%m';
    const now       = periodEnd;

    const inRange   = { $gte: periodStart, $lt: periodEnd };
    const inPrev    = { $gte: prevStart,   $lt: periodStart };

    const [
      // Period totals
      usersInPeriod, usersInPrev,
      appsInPeriod,  appsInPrev,
      hiredInPeriod, hiredInPrev,
      interviewsInPeriod, interviewsInPrev,
      inscInPeriod,  inscInPrev,
      // Series for charts
      usersSeries, appsSeries, interviewsSeries, inscSeries,
      hiredByStatus,
      // Funnel
      totalAppsAll, retainedAll, hiredAll, rejectedAll,
      // Pies / rankings
      countriesAgg, topProgramsAgg, missingSkillsAgg, scoreDistAgg,
      // Mentor leaderboard
      mentorLeaders,
      // Latest score average
      scoreAgg,
    ] = await Promise.all([
      User.countDocuments({ deleted: false, createdAt: inRange }),
      User.countDocuments({ deleted: false, createdAt: inPrev }),
      Application.countDocuments({ deleted: false, createdAt: inRange }),
      Application.countDocuments({ deleted: false, createdAt: inPrev }),
      Application.countDocuments({ deleted: false, status: 4, createdAt: inRange }),
      Application.countDocuments({ deleted: false, status: 4, createdAt: inPrev }),
      Interview.countDocuments({ scheduledAt: inRange }),
      Interview.countDocuments({ scheduledAt: inPrev }),
      Inscription.countDocuments({ deleted: { $ne: true }, createdAt: inRange }),
      Inscription.countDocuments({ deleted: { $ne: true }, createdAt: inPrev }),

      User.aggregate<{ d: string; count: number }>([
        { $match: { deleted: false, createdAt: inRange } },
        { $group: { _id: { $dateToString: { format: dayFormat, date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, d: '$_id', count: 1 } },
      ]),
      Application.aggregate<{ d: string; count: number }>([
        { $match: { deleted: false, createdAt: inRange } },
        { $group: { _id: { $dateToString: { format: dayFormat, date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, d: '$_id', count: 1 } },
      ]),
      Interview.aggregate<{ d: string; count: number }>([
        { $match: { scheduledAt: inRange } },
        { $group: { _id: { $dateToString: { format: dayFormat, date: '$scheduledAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, d: '$_id', count: 1 } },
      ]),
      Inscription.aggregate<{ d: string; count: number }>([
        { $match: { deleted: { $ne: true }, createdAt: inRange } },
        { $group: { _id: { $dateToString: { format: dayFormat, date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, d: '$_id', count: 1 } },
      ]),

      Application.aggregate<{ status: number; count: number }>([
        { $match: { deleted: false, createdAt: inRange } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { _id: 0, status: '$_id', count: 1 } },
      ]),

      Application.countDocuments({ deleted: false }),
      Application.countDocuments({ deleted: false, status: 3 }),
      Application.countDocuments({ deleted: false, status: 4 }),
      Application.countDocuments({ deleted: false, status: 2 }),

      User.aggregate<{ country: string; count: number }>([
        { $match: { roles: 'CANDIDATE', deleted: false, country: { $exists: true, $ne: null } } },
        { $group: { _id: '$country', count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 10 },
        { $project: { _id: 0, country: '$_id', count: 1 } },
      ]),
      Inscription.aggregate<{ title: string; count: number }>([
        { $match: { deleted: { $ne: true } } },
        { $unwind: '$programs' },
        { $group: { _id: '$programs', count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 8 },
        { $lookup: { from: 'programs', localField: '_id', foreignField: '_id', as: 'prog' } },
        { $project: { _id: 0, count: 1, title: { $ifNull: [{ $arrayElemAt: ['$prog.title.fr', 0] }, 'Programme'] } } },
      ]),
      Application.aggregate<{ skill: string; count: number }>([
        { $match: { deleted: false, missingSkills: { $exists: true, $ne: [] } } },
        { $unwind: '$missingSkills' },
        { $group: { _id: '$missingSkills', count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 10 },
        { $project: { _id: 0, skill: '$_id', count: 1 } },
      ]),
      Application.aggregate<{ range: string; count: number }>([
        { $match: { deleted: false, matchScore: { $exists: true, $ne: null } } },
        { $bucket: {
          groupBy: '$matchScore', boundaries: [0, 30, 50, 70, 85, 101],
          default: 'other', output: { count: { $sum: 1 } },
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

      Inscription.aggregate<{ mentor: string; firstName: string; lastName: string; count: number }>([
        { $match: { deleted: { $ne: true }, mentor: { $ne: null } } },
        { $group: { _id: '$mentor', count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 6 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } },
        { $project: {
          _id: 0,
          mentor: { $toString: '$_id' },
          firstName: { $ifNull: [{ $arrayElemAt: ['$u.firstName.fr', 0] }, 'Mentor'] },
          lastName:  { $ifNull: [{ $arrayElemAt: ['$u.lastName.fr', 0] },  '' ] },
          count: 1,
        }},
      ]),

      Application.aggregate<{ avg: number }>([
        { $match: { matchScore: { $exists: true, $ne: null }, deleted: false } },
        { $group: { _id: null, avg: { $avg: '$matchScore' } } },
      ]),
    ]);

    const delta = (curr: number, prev: number): number => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 1000) / 10;
    };

    const avgScore = Array.isArray(scoreAgg) && scoreAgg.length
      ? Math.round(scoreAgg[0].avg || 0) : 0;
    const conversionRate = totalAppsAll > 0
      ? Math.round((hiredAll / totalAppsAll) * 100) : 0;

    res.json({
      period, days,
      range: { from: periodStart.toISOString(), to: now.toISOString() },
      kpis: {
        newUsers:       { value: usersInPeriod,       previous: usersInPrev,       delta: delta(usersInPeriod, usersInPrev) },
        newApps:        { value: appsInPeriod,        previous: appsInPrev,        delta: delta(appsInPeriod, appsInPrev) },
        hires:          { value: hiredInPeriod,       previous: hiredInPrev,       delta: delta(hiredInPeriod, hiredInPrev) },
        interviews:     { value: interviewsInPeriod,  previous: interviewsInPrev,  delta: delta(interviewsInPeriod, interviewsInPrev) },
        inscriptions:   { value: inscInPeriod,        previous: inscInPrev,        delta: delta(inscInPeriod, inscInPrev) },
        avgMatchScore:  { value: avgScore,            previous: 0,                 delta: 0 },
        conversionRate: { value: conversionRate,      previous: 0,                 delta: 0 },
      },
      series: {
        users:        Array.isArray(usersSeries)      ? usersSeries      : [],
        applications: Array.isArray(appsSeries)       ? appsSeries       : [],
        interviews:   Array.isArray(interviewsSeries) ? interviewsSeries : [],
        inscriptions: Array.isArray(inscSeries)       ? inscSeries       : [],
      },
      funnel: {
        applied:    totalAppsAll,
        retained:   retainedAll,
        hired:      hiredAll,
        rejected:   rejectedAll,
      },
      byStatus:       Array.isArray(hiredByStatus)   ? hiredByStatus   : [],
      countries:      Array.isArray(countriesAgg)    ? countriesAgg    : [],
      topPrograms:    Array.isArray(topProgramsAgg)  ? topProgramsAgg  : [],
      missingSkills:  Array.isArray(missingSkillsAgg) ? missingSkillsAgg : [],
      scoreDist:      Array.isArray(scoreDistAgg)    ? scoreDistAgg    : [],
      mentorLeaders:  Array.isArray(mentorLeaders)   ? mentorLeaders   : [],
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};
