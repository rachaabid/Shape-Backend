import { Request, Response } from 'express';
import User        from '../models/User';
import JobOffer    from '../models/JobOffer';
import Application from '../models/JobOfferApplication';
import Interview   from '../models/Interview';

// Application status codes
// 1 = Applied (pending)  2 = Rejected  3 = Retained/Interview  4 = Hired  5 = Intern

export const getStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    // ── Comptages simples en parallèle ────────────────────────
    const [
      totalUsers,
      totalCandidates,
      totalCompanies,
      totalOffers,
      openOffers,
      totalApplications,
      retainedApps,
      rejectedApps,
      hiredApps,
      totalInterviews,
      scheduledInterviews,
      scoreAgg,
    ] = await Promise.all([
      User.countDocuments({ deleted: false }),
      User.countDocuments({ roles: 'CANDIDATE', deleted: false }),
      User.countDocuments({ roles: 'COMPANY',   deleted: false }),
      JobOffer.countDocuments({ deleted: false }),
      JobOffer.countDocuments({ status: 'open', deleted: false }),
      Application.countDocuments({ deleted: false }),
      Application.countDocuments({ status: 3, deleted: false }),  // Retained
      Application.countDocuments({ status: 2, deleted: false }),  // Rejected
      Application.countDocuments({ status: 4, deleted: false }),  // Hired
      Interview.countDocuments(),
      Interview.countDocuments({ status: 'scheduled' }),
      Application.aggregate([
        { $match: { matchScore: { $exists: true, $ne: null }, deleted: false } },
        { $group: { _id: null, avg: { $avg: '$matchScore' } } },
      ]),
    ]);

    // ── Nouvelles inscriptions ce mois-ci ─────────────────────
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth },
      deleted: false,
    });

    // ── Candidatures par mois (6 derniers mois) ───────────────
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const byMonthRaw = await Application.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, deleted: false } },
      {
        $group: {
          _id:   { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthNames = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];
    const byMonth = byMonthRaw.map(d => ({
      month: monthNames[d._id.month - 1],
      count: d.count,
    }));

    // ── Compétences manquantes les plus fréquentes ────────────
    const missingSkillsAgg = await Application.aggregate([
      { $match: { missingSkills: { $exists: true, $ne: [] }, deleted: false } },
      { $unwind: '$missingSkills' },
      { $group: { _id: '$missingSkills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);

    // ── Distribution des scores ────────────────────────────────
    const scoreDistRaw = await Application.aggregate([
      { $match: { matchScore: { $exists: true, $ne: null }, deleted: false } },
      {
        $bucket: {
          groupBy: '$matchScore',
          boundaries: [0, 30, 50, 70, 85, 101],
          default: 'Autre',
          output: { count: { $sum: 1 } },
        },
      },
    ]);

    const scoreLabels = ['0–30', '30–50', '50–70', '70–85', '85–100'];
    const scoreDist = [0, 30, 50, 70, 85].map((bound, i) => ({
      range: scoreLabels[i],
      count: scoreDistRaw.find((b: any) => b._id === bound)?.count || 0,
    }));

    // ── Taux calculés ─────────────────────────────────────────
    const retentionRate = totalApplications > 0
      ? Math.round((retainedApps / totalApplications) * 100)
      : 0;

    const avgScore = Math.round(scoreAgg[0]?.avg || 0);

    res.json({
      users: {
        total:          totalUsers,
        candidates:     totalCandidates,
        companies:      totalCompanies,
        newThisMonth:   newUsersThisMonth,
      },
      offers: {
        total:  totalOffers,
        open:   openOffers,
        closed: totalOffers - openOffers,
      },
      applications: {
        total:         totalApplications,
        pending:       totalApplications - retainedApps - rejectedApps - hiredApps,
        retained:      retainedApps,
        rejected:      rejectedApps,
        hired:         hiredApps,
        retentionRate,
        avgMatchScore: avgScore,
      },
      interviews: {
        total:     totalInterviews,
        scheduled: scheduledInterviews,
        completed: totalInterviews - scheduledInterviews,
      },
      byMonth,
      missingSkills: missingSkillsAgg.map((s: any) => ({ skill: s._id, count: s.count })),
      scoreDist,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};
