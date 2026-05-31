import { Router } from 'express';
import { getAll, getMine, create, approve, reject, revoke } from '../controllers/trainingRequest.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get   ('/mine',        authMiddleware, getMine);
router.get   ('/',            authMiddleware, getAll);
router.post  ('/',            authMiddleware, create);
router.patch ('/:id/approve', authMiddleware, approve);
router.patch ('/:id/reject',  authMiddleware, reject);
router.patch ('/:id/revoke',  authMiddleware, revoke);

export default router;
