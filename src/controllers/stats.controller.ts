import { Request, Response } from 'express';
import User from '../models/User';
import JobOffer from '../models/JobOffer';
import Application from '../models/JobOfferApplication';
import Interview from '../models/Interview';
import Program from '../models/Program';

export const getStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      totalCandidates,
      totalCompanies,
      newThisMonth,
      totalOffers,
      openOffers,
      totalApplications,
      retainedApps,
      rejectedApps,
      hiredApps,
      totalInterviews,
      scheduledInterviews,
      totalPrograms,
      scoreAgg,
      byMonthAgg,
      missingSkillsAgg,
      scoreDistAgg,
    ] = await Promise.all([
      User.countDocuments({ deleted: false }),
      User.countDocuments({ roles: 'CANDIDATE', deleted: false }),
      User.countDocuments({ roles: 'COMPANY', deleted: false }),
      User.countDocuments({ createdAt: { $gte: monthStart }, deleted: false }),
      JobOffer.countDocuments({ deleted: false }),
      JobOffer.countDocuments({ status: 'open', deleted: false }),
      Application.countDocuments({ deleted: false }),
      Application.countDocuments({ status: 3, deleted: false }),
      Application.countDocuments({ status: 2, deleted: false }),
      Application.countDocuments({ status: 4, deleted: false }),
      Interview.countDocuments(),
      Interview.countDocuments({ status: 'scheduled' }),
      Program.countDocuments({ deleted: false }),

      Application.aggregate<{ avg: number }>([
        { $match: { matchScore: { $exists: true, $ne: null }, deleted: false } },
        { $group: { _id: null, avg: { $avg: '$matchScore' } } },
      ]),

      Application.aggregate<{ month: string; count: number }>([
        { $match: { deleted: false, createdAt: { $exists: true } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        }},
        { $sort: { _id: 1 } },
        { $limit: 12 },
        { $project: { _id: 0, month: '$_id', count: 1 } },
      ]),

      Application.aggregate<{ skill: string; count: number }>([
        { $match: { deleted: false, missingSkills: { $exists: true, $ne: [] } } },
        { $unwind: '$missingSkills' },
        { $group: { _id: '$missingSkills', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
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
          range: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', 0]  }, then: '0–30'   },
                { case: { $eq: ['$_id', 30] }, then: '30–50'  },
                { case: { $eq: ['$_id', 50] }, then: '50–70'  },
                { case: { $eq: ['$_id', 70] }, then: '70–85'  },
                { case: { $eq: ['$_id', 85] }, then: '85–100' },
              ],
              default: 'other',
            },
          },
          count: 1,
        }},
      ]),
    ]);

    const avgScore = Array.isArray(scoreAgg) && scoreAgg.length > 0
      ? Math.round(scoreAgg[0].avg || 0)
      : 0;

    const retentionRate = totalApplications > 0
      ? Math.round((retainedApps / totalApplications) * 100)
      : 0;

    res.json({
      users: {
        total: totalUsers,
        candidates: totalCandidates,
        companies: totalCompanies,
        newThisMonth,
      },
      offers: {
        total: totalOffers,
        open: openOffers,
        closed: totalOffers - openOffers,
      },
      applications: {
        total: totalApplications,
        pending: Math.max(0, totalApplications - retainedApps - rejectedApps - hiredApps),
        retained: retainedApps,
        rejected: rejectedApps,
        hired: hiredApps,
        retentionRate,
        avgMatchScore: avgScore,
      },
      interviews: {
        total: totalInterviews,
        scheduled: scheduledInterviews,
        completed: totalInterviews - scheduledInterviews,
      },
      programs: totalPrograms,
      byMonth:       Array.isArray(byMonthAgg)       ? byMonthAgg       : [],
      missingSkills: Array.isArray(missingSkillsAgg) ? missingSkillsAgg : [],
      scoreDist:     Array.isArray(scoreDistAgg)     ? scoreDistAgg     : [],
    });

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};
