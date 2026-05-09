import { Router } from 'express';
import { getAll, getMine, create, accept, reject } from '../controllers/companyProgramProposal.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get   ('/mine',        authMiddleware, getMine);
router.get   ('/',            authMiddleware, getAll);
router.post  ('/',            authMiddleware, create);
router.patch ('/:id/accept',  authMiddleware, accept);
router.patch ('/:id/reject',  authMiddleware, reject);

export default router;
