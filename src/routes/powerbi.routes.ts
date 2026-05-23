import { Router, Request, Response } from 'express';
import axios from 'axios';
import {
  isPowerBiConfigured, pushKpiSnapshot, clearKpiSnapshot, getEmbedInfo,
} from '../services/powerbi.service';

const router = Router();

/** Récupère un snapshot KPI complet en réutilisant /api/stats. */
async function fetchCurrentStats(req: Request): Promise<any> {
  const host = `${req.protocol}://${req.get('host')}`;
  const auth = req.headers.authorization || '';
  const { data } = await axios.get(`${host}/api/stats`, {
    headers: auth ? { Authorization: auth } : undefined,
  });
  return data;
}

/** GET /api/powerbi/status — config OK ? */
router.get('/status', (_req, res) => {
  res.json({ configured: isPowerBiConfigured() });
});

/** GET /api/powerbi/embed-info — fournit URL + token pour le front. */
router.get('/embed-info', async (_req, res) => {
  try {
    if (!isPowerBiConfigured()) {
      return res.status(503).json({ message: 'Power BI non configuré.' });
    }
    const info = await getEmbedInfo();
    return res.json(info);
  } catch (err: any) {
    const status = err.response?.status || 500;
    const detail = err.response?.data || err.message;
    console.error('PowerBI embed-info error:', detail);
    return res.status(status).json({ message: 'Erreur Power BI', detail });
  }
});

/** POST /api/powerbi/push — pousse maintenant les KPI courants. */
router.post('/push', async (req: Request, res: Response) => {
  try {
    if (!isPowerBiConfigured()) {
      return res.status(503).json({ message: 'Power BI non configuré.' });
    }
    const stats = await fetchCurrentStats(req);
    await pushKpiSnapshot(stats);
    return res.json({ ok: true, pushedAt: new Date().toISOString() });
  } catch (err: any) {
    const detail = err.response?.data || err.message;
    console.error('PowerBI push error:', detail);
    return res.status(500).json({ message: 'Échec du push', detail });
  }
});

/** POST /api/powerbi/reset — vide les tables (avant un nouveau push complet). */
router.post('/reset', async (_req, res) => {
  try {
    if (!isPowerBiConfigured()) {
      return res.status(503).json({ message: 'Power BI non configuré.' });
    }
    await clearKpiSnapshot();
    return res.json({ ok: true });
  } catch (err: any) {
    console.error('PowerBI reset error:', err.response?.data || err.message);
    return res.status(500).json({ message: 'Échec du reset' });
  }
});

export default router;
