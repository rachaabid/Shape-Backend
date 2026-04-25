import { Router } from 'express';
import { getStats } from '../controllers/stats.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// GET /api/stats — agrégations pour le reporting Power BI et le backoffice
router.get('/', authMiddleware, getStats);

export default router;
