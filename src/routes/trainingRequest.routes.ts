import { Router } from 'express';
import {
  getAll, getArchived, getMine, create,
  approve, reject, revoke, archive, unarchive,
} from '../controllers/trainingRequest.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get   ('/mine',          authMiddleware, getMine);
router.get   ('/archived',      authMiddleware, getArchived);
router.get   ('/',              authMiddleware, getAll);
router.post  ('/',              authMiddleware, create);
router.patch ('/:id/approve',   authMiddleware, approve);
router.patch ('/:id/reject',    authMiddleware, reject);
router.patch ('/:id/revoke',    authMiddleware, revoke);
router.patch ('/:id/archive',   authMiddleware, archive);
router.patch ('/:id/unarchive', authMiddleware, unarchive);

export default router;
