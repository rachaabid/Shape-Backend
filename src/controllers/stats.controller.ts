/**
 * Contrôleur stats — fin et purement HTTP.
 * Toute la logique d'agrégation vit dans `services/stats/*`.
 */
import { asyncHandler } from '../middleware/asyncHandler';
import { buildGlobalStats } from '../services/stats/global-stats.service';
import { buildBiStats }     from '../services/stats/bi-stats.service';
import { BiPeriod }         from '../services/stats/bi-period';

/** GET /api/stats — snapshot global de la plateforme. */
export const getStats = asyncHandler(async (req, res) => {
  const lang = typeof req.query['lang'] === 'string' ? req.query['lang'] : 'fr';
  res.json(await buildGlobalStats(lang));
});

/**
 * GET /api/stats/bi
 *   ?period=30d|7d|90d|year       — période prédéfinie
 *   ?from=YYYY-MM-DD&to=YYYY-MM-DD — plage personnalisée (prioritaire)
 */
export const getBiStats = asyncHandler(async (req, res) => {
  const q = req.query as { period?: string; from?: string; to?: string; lang?: string };
  const period = BiPeriod.fromQuery(q);
  const lang = typeof q.lang === 'string' ? q.lang : 'fr';
  res.json(await buildBiStats(period, lang));
});
