import { Router } from 'express';
import { getStats, getBiStats } from '../controllers/stats.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// GET /api/stats — agrégations globales (utilisé par dashboard + Power BI push)
router.get('/',    authMiddleware, getStats);

// GET /api/stats/bi?period=7d|30d|90d|year — BI enrichie : deltas + séries
router.get('/bi',  authMiddleware, getBiStats);

export default router;
