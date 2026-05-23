/**
 * Contrôleur stats — fin et purement HTTP.
 * Toute la logique d'agrégation vit dans `services/stats/*`.
 */
import { asyncHandler } from '../middleware/asyncHandler';
import { buildGlobalStats } from '../services/stats/global-stats.service';
import { buildBiStats }     from '../services/stats/bi-stats.service';
import { BiPeriod }         from '../services/stats/bi-period';

/** GET /api/stats — snapshot global de la plateforme. */
export const getStats = asyncHandler(async (_req, res) => {
  res.json(await buildGlobalStats());
});

/**
 * GET /api/stats/bi
 *   ?period=30d|7d|90d|year       — période prédéfinie
 *   ?from=YYYY-MM-DD&to=YYYY-MM-DD — plage personnalisée (prioritaire)
 */
export const getBiStats = asyncHandler(async (req, res) => {
  const period = BiPeriod.fromQuery(req.query as { period?: string; from?: string; to?: string });
  res.json(await buildBiStats(period));
});
