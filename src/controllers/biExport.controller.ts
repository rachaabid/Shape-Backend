/**
 * Endpoints "Power BI Desktop" — exposent les KPI sous forme CSV / JSON,
 * directement consommables par le connecteur Web de Power BI Desktop
 * (Get Data → Web → URL).
 *
 * Pas de stockage cloud, pas d'Azure AD. Power BI Desktop appelle
 * périodiquement ces URLs (bouton "Refresh") pour rafraîchir le rapport.
 *
 * Authentification optionnelle via une clé en query-param :
 *   - Si `POWERBI_EXPORT_TOKEN` est défini dans .env, les endpoints exigent
 *     `?token=<la-clé>`. Sinon ils sont publics (dev par défaut).
 */
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { HttpError }    from '../utils/HttpError';
import { buildGlobalStats } from '../services/stats/global-stats.service';
import Application from '../models/JobOfferApplication';

// ── Auth via token optionnel ─────────────────────────────────────
export const exportTokenGuard = (req: Request, _res: Response, next: NextFunction) => {
  const expected = process.env['POWERBI_EXPORT_TOKEN'];
  if (!expected) return next();   // pas de token configuré → public
  const got = req.query['token'] || req.headers['x-export-token'];
  if (got !== expected) return next(HttpError.unauthorized('Token d\'export manquant ou invalide.'));
  next();
};

// ── Helpers CSV ──────────────────────────────────────────────────

/** Échappe une valeur pour CSV (RFC 4180). */
function csvCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Sérialise une liste d'objets homogènes en CSV avec en-tête. */
function toCsv<T extends Record<string, unknown>>(rows: T[], columns: (keyof T)[]): string {
  const header = columns.map(c => csvCell(c)).join(',');
  const body   = rows.map(r => columns.map(c => csvCell(r[c])).join(',')).join('\n');
  return `${header}\n${body}\n`;
}

/** Envoie une réponse CSV avec les bons en-têtes. */
function sendCsv(res: Response, filename: string, csv: string): void {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  // Pour PBI Desktop : pas de cache, on veut toujours la dernière version.
  res.setHeader('Cache-Control', 'no-store');
  res.send(csv);
}

// ── Endpoints ─────────────────────────────────────────────────────

/**
 * GET /api/bi-export — JSON consolidé (toutes les tables).
 * Idéal pour Power BI Desktop : Get Data → Web → URL → toutes les tables
 * apparaissent dans Power Query et peuvent être chargées individuellement.
 */
export const getAllJson = asyncHandler(async (_req, res) => {
  const stats = await buildGlobalStats();
  res.json({
    generatedAt: new Date().toISOString(),
    snapshot: {
      timestamp:          new Date().toISOString(),
      totalUsers:         stats.users.total,
      candidates:         stats.users.candidates,
      companies:          stats.users.companies,
      mentors:            stats.users.mentors,
      newUsersThisMonth:  stats.users.newThisMonth,
      pendingValidation:  stats.users.pendingValidation,
      offersTotal:        stats.offers.total,
      offersOpen:         stats.offers.open,
      offersClosed:       stats.offers.closed,
      applicationsTotal:  stats.applications.total,
      applicationsHired:  stats.applications.hired,
      applicationsRetained: stats.applications.retained,
      applicationsRejected: stats.applications.rejected,
      applicationsPending:  stats.applications.pending,
      conversionRate:     stats.applications.conversionRate,
      retentionRate:      stats.applications.retentionRate,
      avgMatchScore:      stats.applications.avgMatchScore,
      interviewsTotal:    stats.interviews.total,
      interviewsScheduled: stats.interviews.scheduled,
      interviewsCompleted: stats.interviews.completed,
      interviewsCancelled: stats.interviews.cancelled,
      interviewsUpcoming:  stats.interviews.upcoming,
      trainingsTotal:       stats.formation.trainings,
      trainingsOnline:      stats.formation.onlineTrainings,
      inscriptions:        stats.formation.inscriptions,
      completedInscriptions: stats.formation.completedInscriptions,
      completionRate:        stats.formation.completionRate,
      activeMentors:         stats.formation.activeMentors,
      avgEvalScore:          stats.formation.avgEvalScore,
      tasksOpen:       stats.formation.tasks.open,
      tasksInProgress: stats.formation.tasks.inProgress,
      tasksReview:     stats.formation.tasks.review,
      tasksDone:       stats.formation.tasks.done,
    },
    registrations: stats.registrations,
    applicationsByMonth: stats.byMonth,
    countries:     stats.countries,
    topTrainings:   stats.topTrainings,
    missingSkills: stats.missingSkills,
    scoreDistribution: stats.scoreDist,
  });
});

/** GET /api/bi-export/snapshot.csv — une seule ligne, les KPI courants. */
export const getSnapshotCsv = asyncHandler(async (_req, res) => {
  const s = await buildGlobalStats();
  const row = {
    timestamp:          new Date().toISOString(),
    totalUsers:         s.users.total,
    candidates:         s.users.candidates,
    companies:          s.users.companies,
    mentors:            s.users.mentors,
    newUsersThisMonth:  s.users.newThisMonth,
    pendingValidation:  s.users.pendingValidation,
    offersTotal:        s.offers.total,
    offersOpen:         s.offers.open,
    applicationsTotal:  s.applications.total,
    applicationsHired:  s.applications.hired,
    conversionRate:     s.applications.conversionRate,
    retentionRate:      s.applications.retentionRate,
    avgMatchScore:      s.applications.avgMatchScore,
    interviewsUpcoming: s.interviews.upcoming,
    completionRate:     s.formation.completionRate,
    activeMentors:      s.formation.activeMentors,
    avgEvalScore:       s.formation.avgEvalScore,
  };
  sendCsv(res, 'snapshot.csv', toCsv([row], Object.keys(row) as (keyof typeof row)[]));
});

/** GET /api/bi-export/registrations.csv — inscriptions mensuelles (12 mois). */
export const getRegistrationsCsv = asyncHandler(async (_req, res) => {
  const { registrations } = await buildGlobalStats();
  sendCsv(res, 'registrations.csv', toCsv(registrations, ['month', 'count']));
});

/** GET /api/bi-export/applications-by-month.csv */
export const getApplicationsByMonthCsv = asyncHandler(async (_req, res) => {
  const { byMonth } = await buildGlobalStats();
  sendCsv(res, 'applications-by-month.csv', toCsv(byMonth, ['month', 'count']));
});

/** GET /api/bi-export/countries.csv */
export const getCountriesCsv = asyncHandler(async (_req, res) => {
  const { countries } = await buildGlobalStats();
  sendCsv(res, 'countries.csv', toCsv(countries, ['country', 'count']));
});

/** GET /api/bi-export/top-trainings.csv */
export const getTopTrainingsCsv = asyncHandler(async (_req, res) => {
  const { topTrainings } = await buildGlobalStats();
  sendCsv(res, 'top-trainings.csv', toCsv(topTrainings, ['title', 'count']));
});

/** GET /api/bi-export/missing-skills.csv */
export const getMissingSkillsCsv = asyncHandler(async (_req, res) => {
  const { missingSkills } = await buildGlobalStats();
  sendCsv(res, 'missing-skills.csv', toCsv(missingSkills, ['skill', 'count']));
});

/** GET /api/bi-export/score-distribution.csv */
export const getScoreDistributionCsv = asyncHandler(async (_req, res) => {
  const { scoreDist } = await buildGlobalStats();
  sendCsv(res, 'score-distribution.csv', toCsv(scoreDist, ['range', 'count']));
});

/** GET /api/bi-export/funnel.csv — entonnoir de candidatures (4 étapes) */
export const getFunnelCsv = asyncHandler(async (_req, res) => {
  const { applications, interviews } = await buildGlobalStats();
  const rows = [
    { stage: 'Total candidatures', count: applications.total    },
    { stage: 'Sélectionnés',       count: applications.retained },
    { stage: 'En entretien',       count: interviews.total      },
    { stage: 'Recrutés',           count: applications.hired    },
  ];
  sendCsv(res, 'funnel.csv', toCsv(rows, ['stage', 'count']));
});

/** GET /api/bi-export/application-status.csv — répartition des candidatures par statut */
export const getApplicationStatusCsv = asyncHandler(async (_req, res) => {
  const STATUS_LABELS: Record<number, string> = {
    0: 'Postulé',
    1: 'Sélectionné',
    2: 'Refusé',
    3: 'En entretien',
    4: 'Recruté',
    5: 'Stagiaire',
  };
  const agg = await Application.aggregate<{ status: number; count: number }>([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $project: { _id: 0, status: '$_id', count: 1 } },
    { $sort: { status: 1 } },
  ]);
  const rows = agg.map(r => ({
    label: STATUS_LABELS[r.status] ?? `Statut ${r.status}`,
    count: r.count,
  }));
  sendCsv(res, 'application-status.csv', toCsv(rows, ['label', 'count']));
});
