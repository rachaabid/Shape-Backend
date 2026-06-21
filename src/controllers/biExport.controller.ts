/**
 * Endpoints "Power BI Desktop" — exposent les KPI sous forme CSV / JSON.
 * Accepte ?period=7d|30d|90d|year ou ?from=YYYY-MM-DD&to=YYYY-MM-DD
 * pour renvoyer exactement les mêmes données que le backoffice BI Report.
 */
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { HttpError }    from '../utils/HttpError';
import { BiPeriod }     from '../services/stats/bi-period';
import { buildBiStats } from '../services/stats/bi-stats.service';

// ── Auth via token optionnel ─────────────────────────────────────
export const exportTokenGuard = (req: Request, _res: Response, next: NextFunction) => {
  const expected = process.env['POWERBI_EXPORT_TOKEN'];
  if (!expected) return next();
  const got = req.query['token'] || req.headers['x-export-token'];
  if (got !== expected) return next(HttpError.unauthorized('Token d\'export manquant ou invalide.'));
  next();
};

// ── Helpers CSV ──────────────────────────────────────────────────

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv<T extends Record<string, unknown>>(rows: T[], columns: (keyof T)[]): string {
  const header = columns.map(c => csvCell(c)).join(',');
  const body   = rows.map(r => columns.map(c => csvCell(r[c])).join(',')).join('\n');
  return `${header}\n${body}\n`;
}

function sendCsv(res: Response, filename: string, csv: string): void {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.setHeader('Cache-Control', 'no-store');
  res.send(csv);
}

// ── Endpoints ─────────────────────────────────────────────────────

/**
 * GET /api/bi-export — JSON consolidé avec le même calcul que le backoffice.
 * ?period=30d (défaut) | 7d | 90d | year | ?from=...&to=...
 */
export const getAllJson = asyncHandler(async (req, res) => {
  const period = BiPeriod.fromQuery(req.query as any);
  const s = await buildBiStats(period);

  const STATUS_LABELS: Record<number, string> = {
    0: 'Postulé', 1: 'Sélectionné', 2: 'Refusé',
    3: 'En entretien', 4: 'Recruté', 5: 'Stagiaire',
  };

  res.json({
    generatedAt: new Date().toISOString(),
    period:      s.period,
    range:       s.range,
    snapshot: {
      newUsers:       s.kpis.newUsers.value,
      newApps:        s.kpis.newApps.value,
      hires:          s.kpis.hires.value,
      interviews:     s.kpis.interviews.value,
      inscriptions:   s.kpis.inscriptions.value,
      avgMatchScore:  s.kpis.avgMatchScore.value,
      conversionRate: s.kpis.conversionRate.value,
    },
    usersSeries:        s.series.users,
    applicationsSeries: s.series.applications,
    interviewsSeries:   s.series.interviews,
    inscriptionsSeries: s.series.inscriptions,
    funnel: [
      { stage: 'Total candidatures', count: s.funnel.applied  },
      { stage: 'Sélectionnés',       count: s.funnel.retained },
      { stage: 'En entretien',       count: s.kpis.interviews.value },
      { stage: 'Recrutés',           count: s.funnel.hired    },
    ],
    applicationStatus: s.byStatus.map(r => ({
      label: STATUS_LABELS[r.status] ?? `Statut ${r.status}`,
      count: r.count,
    })),
    countries:         s.countries,
    topTrainings:      s.topTrainings,
    missingSkills:     s.missingSkills,
    scoreDistribution: s.scoreDist,
    mentorLeaders:     s.mentorLeaders,
  });
});

/** GET /api/bi-export/snapshot.csv */
export const getSnapshotCsv = asyncHandler(async (req, res) => {
  const period = BiPeriod.fromQuery(req.query as any);
  const s = await buildBiStats(period);
  const row = {
    period:         s.period,
    from:           s.range.from,
    to:             s.range.to,
    newUsers:       s.kpis.newUsers.value,
    newApps:        s.kpis.newApps.value,
    hires:          s.kpis.hires.value,
    interviews:     s.kpis.interviews.value,
    inscriptions:   s.kpis.inscriptions.value,
    avgMatchScore:  s.kpis.avgMatchScore.value,
    conversionRate: s.kpis.conversionRate.value,
  };
  sendCsv(res, 'snapshot.csv', toCsv([row], Object.keys(row) as (keyof typeof row)[]));
});

/** GET /api/bi-export/registrations.csv */
export const getRegistrationsCsv = asyncHandler(async (req, res) => {
  const period = BiPeriod.fromQuery(req.query as any);
  const s = await buildBiStats(period);
  const rows = s.series.users.map(r => ({ date: r.d, count: r.count }));
  sendCsv(res, 'registrations.csv', toCsv(rows, ['date', 'count']));
});

/** GET /api/bi-export/applications-by-month.csv */
export const getApplicationsByMonthCsv = asyncHandler(async (req, res) => {
  const period = BiPeriod.fromQuery(req.query as any);
  const s = await buildBiStats(period);
  const rows = s.series.applications.map(r => ({ date: r.d, count: r.count }));
  sendCsv(res, 'applications-by-month.csv', toCsv(rows, ['date', 'count']));
});

/** GET /api/bi-export/interviews.csv */
export const getInterviewsCsv = asyncHandler(async (req, res) => {
  const period = BiPeriod.fromQuery(req.query as any);
  const s = await buildBiStats(period);
  const rows = s.series.interviews.map(r => ({ date: r.d, count: r.count }));
  sendCsv(res, 'interviews.csv', toCsv(rows, ['date', 'count']));
});

/** GET /api/bi-export/inscriptions.csv */
export const getInscriptionsCsv = asyncHandler(async (req, res) => {
  const period = BiPeriod.fromQuery(req.query as any);
  const s = await buildBiStats(period);
  const rows = s.series.inscriptions.map(r => ({ date: r.d, count: r.count }));
  sendCsv(res, 'inscriptions.csv', toCsv(rows, ['date', 'count']));
});

/** GET /api/bi-export/mentor-leaders.csv */
export const getMentorLeadersCsv = asyncHandler(async (req, res) => {
  const period = BiPeriod.fromQuery(req.query as any);
  const s = await buildBiStats(period);
  const rows = s.mentorLeaders.map(r => ({
    mentor: `${r.firstName} ${r.lastName}`.trim() || r.mentor,
    inscriptions: r.count,
  }));
  sendCsv(res, 'mentor-leaders.csv', toCsv(rows, ['mentor', 'inscriptions']));
});

/** GET /api/bi-export/countries.csv */
export const getCountriesCsv = asyncHandler(async (req, res) => {
  const period = BiPeriod.fromQuery(req.query as any);
  const s = await buildBiStats(period);
  sendCsv(res, 'countries.csv', toCsv(s.countries, ['country', 'count']));
});

/** GET /api/bi-export/top-trainings.csv */
export const getTopTrainingsCsv = asyncHandler(async (req, res) => {
  const period = BiPeriod.fromQuery(req.query as any);
  const s = await buildBiStats(period);
  sendCsv(res, 'top-trainings.csv', toCsv(s.topTrainings, ['title', 'count']));
});

/** GET /api/bi-export/missing-skills.csv */
export const getMissingSkillsCsv = asyncHandler(async (req, res) => {
  const period = BiPeriod.fromQuery(req.query as any);
  const s = await buildBiStats(period);
  sendCsv(res, 'missing-skills.csv', toCsv(s.missingSkills, ['skill', 'count']));
});

/** GET /api/bi-export/score-distribution.csv */
export const getScoreDistributionCsv = asyncHandler(async (req, res) => {
  const period = BiPeriod.fromQuery(req.query as any);
  const s = await buildBiStats(period);
  sendCsv(res, 'score-distribution.csv', toCsv(s.scoreDist, ['range', 'count']));
});

/** GET /api/bi-export/funnel.csv */
export const getFunnelCsv = asyncHandler(async (req, res) => {
  const period = BiPeriod.fromQuery(req.query as any);
  const s = await buildBiStats(period);
  const rows = [
    { stage: 'Postulé',      count: s.funnel.applied  },
    { stage: 'En entretien', count: s.funnel.retained },
    { stage: 'Embauché',     count: s.funnel.hired    },
    { stage: 'Rejeté',       count: s.funnel.rejected },
  ];
  sendCsv(res, 'funnel.csv', toCsv(rows, ['stage', 'count']));
});

/** GET /api/bi-export/application-status.csv */
export const getApplicationStatusCsv = asyncHandler(async (req, res) => {
  const period = BiPeriod.fromQuery(req.query as any);
  const s = await buildBiStats(period);
  const STATUS_LABELS: Record<number, string> = {
    0: 'Postulé', 1: 'Sélectionné', 2: 'Refusé',
    3: 'En entretien', 4: 'Recruté', 5: 'Stagiaire',
  };
  const rows = s.byStatus.map(r => ({
    label: STATUS_LABELS[r.status] ?? `Statut ${r.status}`,
    count: r.count,
  }));
  sendCsv(res, 'application-status.csv', toCsv(rows, ['label', 'count']));
});
