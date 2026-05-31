/**
 * Statistiques BI sur fenêtre temporelle ajustable :
 *   - KPI valeur courante + valeur précédente + delta (%)
 *   - Séries quotidiennes / mensuelles pour les graphes time-series
 *   - Funnel candidatures
 *   - Classements (pays / programmes / compétences manquantes / mentors)
 */
import User from '../../models/User';
import Application from '../../models/JobOfferApplication';
import Interview from '../../models/Interview';
import Inscription from '../../models/Inscription';
import { BiPeriod, computeDelta } from './bi-period';

const APP_STATUS = { RETAINED: 2, REJECTED: 3, HIRED: 4 } as const;

export interface BiKpi { value: number; previous: number; delta: number; }

export interface BiStats {
  period: string; days: number;
  range: { from: string; to: string };
  kpis: {
    newUsers:       BiKpi;
    newApps:        BiKpi;
    hires:          BiKpi;
    interviews:     BiKpi;
    inscriptions:   BiKpi;
    avgMatchScore:  BiKpi;
    conversionRate: BiKpi;
  };
  series: {
    users:        { d: string; count: number }[];
    applications: { d: string; count: number }[];
    interviews:   { d: string; count: number }[];
    inscriptions: { d: string; count: number }[];
  };
  funnel: { applied: number; retained: number; hired: number; rejected: number };
  byStatus:      { status: number; count: number }[];
  countries:     { country: string; count: number }[];
  topTrainings:   { title: string; count: number }[];
  missingSkills: { skill: string; count: number }[];
  scoreDist:     { range: string; count: number }[];
  mentorLeaders: { mentor: string; firstName: string; lastName: string; count: number }[];
}

/**
 * Construit un agrégat journalier (ou mensuel selon `dayFormat`) pour un
 * modèle Mongoose donné, sur la fenêtre `inRange`.
 */
function dailySeriesAgg(
  Model: any, dateField: string, filterBase: Record<string, unknown>,
  inRange: Record<string, unknown>, dayFormat: string,
): Promise<{ d: string; count: number }[]> {
  return Model.aggregate([
    { $match: { ...filterBase, [dateField]: inRange } },
    { $group: {
      _id: { $dateToString: { format: dayFormat, date: `$${dateField}` } },
      count: { $sum: 1 },
    } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, d: '$_id', count: 1 } },
  ]);
}

export async function buildBiStats(period: BiPeriod): Promise<BiStats> {
  const { inRange, inPrev, dayFormat } = period;
  const usersBase = { deleted: false };
  const appsBase  = { deleted: false };
  const inscBase  = { deleted: { $ne: true } };

  const [
    // Period totals
    usersInPeriod, usersInPrev,
    appsInPeriod,  appsInPrev,
    hiredInPeriod, hiredInPrev,
    interviewsInPeriod, interviewsInPrev,
    inscInPeriod,  inscInPrev,
    // Time series
    usersSeries, appsSeries, interviewsSeries, inscSeries,
    // Status pie
    hiredByStatus,
    // All-time funnel
    totalAppsAll, retainedAll, hiredAll, rejectedAll,
    // Rankings
    countriesAgg, topTrainingsAgg, missingSkillsAgg, scoreDistAgg,
    mentorLeaders,
    // Score moyen
    scoreAgg,
  ] = await Promise.all([
    User.countDocuments({ ...usersBase, createdAt: inRange }),
    User.countDocuments({ ...usersBase, createdAt: inPrev  }),
    Application.countDocuments({ ...appsBase,  createdAt: inRange }),
    Application.countDocuments({ ...appsBase,  createdAt: inPrev  }),
    Application.countDocuments({ ...appsBase, status: APP_STATUS.HIRED, createdAt: inRange }),
    Application.countDocuments({ ...appsBase, status: APP_STATUS.HIRED, createdAt: inPrev  }),
    Interview.countDocuments({ scheduledAt: inRange }),
    Interview.countDocuments({ scheduledAt: inPrev  }),
    Inscription.countDocuments({ ...inscBase, createdAt: inRange }),
    Inscription.countDocuments({ ...inscBase, createdAt: inPrev  }),

    dailySeriesAgg(User,        'createdAt',   usersBase, inRange, dayFormat),
    dailySeriesAgg(Application, 'createdAt',   appsBase,  inRange, dayFormat),
    dailySeriesAgg(Interview,   'scheduledAt', {},        inRange, dayFormat),
    dailySeriesAgg(Inscription, 'createdAt',   inscBase,  inRange, dayFormat),

    Application.aggregate<{ status: number; count: number }>([
      { $match: { ...appsBase, createdAt: inRange } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
    ]),

    Application.countDocuments(appsBase),
    Application.countDocuments({ ...appsBase, status: APP_STATUS.RETAINED }),
    Application.countDocuments({ ...appsBase, status: APP_STATUS.HIRED }),
    Application.countDocuments({ ...appsBase, status: APP_STATUS.REJECTED }),

    User.aggregate<{ country: string; count: number }>([
      { $match: { roles: 'CANDIDATE', deleted: false, country: { $exists: true, $ne: null } } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 10 },
      { $project: { _id: 0, country: '$_id', count: 1 } },
    ]),

    Inscription.aggregate<{ title: string; count: number }>([
      { $match: { deleted: { $ne: true } } },
      { $unwind: '$trainings' },
      { $group: { _id: '$trainings', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 8 },
      { $lookup: { from: 'trainings', localField: '_id', foreignField: '_id', as: 'prog' } },
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

  const avgScore = Array.isArray(scoreAgg) && scoreAgg.length
    ? Math.round(scoreAgg[0].avg || 0) : 0;
  const conversionRate = totalAppsAll > 0 ? Math.round((hiredAll / totalAppsAll) * 100) : 0;

  return {
    period: period.label, days: period.days,
    range: { from: period.periodStart.toISOString(), to: period.periodEnd.toISOString() },
    kpis: {
      newUsers:       { value: usersInPeriod,      previous: usersInPrev,      delta: computeDelta(usersInPeriod, usersInPrev) },
      newApps:        { value: appsInPeriod,       previous: appsInPrev,       delta: computeDelta(appsInPeriod, appsInPrev) },
      hires:          { value: hiredInPeriod,      previous: hiredInPrev,      delta: computeDelta(hiredInPeriod, hiredInPrev) },
      interviews:     { value: interviewsInPeriod, previous: interviewsInPrev, delta: computeDelta(interviewsInPeriod, interviewsInPrev) },
      inscriptions:   { value: inscInPeriod,       previous: inscInPrev,       delta: computeDelta(inscInPeriod, inscInPrev) },
      avgMatchScore:  { value: avgScore,           previous: 0, delta: 0 },
      conversionRate: { value: conversionRate,     previous: 0, delta: 0 },
    },
    series: {
      users:        Array.isArray(usersSeries)      ? usersSeries      : [],
      applications: Array.isArray(appsSeries)       ? appsSeries       : [],
      interviews:   Array.isArray(interviewsSeries) ? interviewsSeries : [],
      inscriptions: Array.isArray(inscSeries)       ? inscSeries       : [],
    },
    funnel: { applied: totalAppsAll, retained: retainedAll, hired: hiredAll, rejected: rejectedAll },
    byStatus:      Array.isArray(hiredByStatus)    ? hiredByStatus    : [],
    countries:     Array.isArray(countriesAgg)     ? countriesAgg     : [],
    topTrainings:   Array.isArray(topTrainingsAgg)   ? topTrainingsAgg   : [],
    missingSkills: Array.isArray(missingSkillsAgg) ? missingSkillsAgg : [],
    scoreDist:     Array.isArray(scoreDistAgg)     ? scoreDistAgg     : [],
    mentorLeaders: Array.isArray(mentorLeaders)    ? mentorLeaders    : [],
  };
}
