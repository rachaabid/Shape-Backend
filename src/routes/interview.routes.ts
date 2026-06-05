import { Router } from 'express';
import {
  getByCandidate, getByCompany, getById, create, patch, confirm, getInterviews,
  getArchivedInterviews, restoreInterview, removeInterview,
} from '../controllers/interview.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get   ('/archived',             authMiddleware, getArchivedInterviews);
router.get   ('/',                     authMiddleware, getInterviews);   // admin — tous les entretiens
router.get   ('/confirm',              confirm);                         // public — email link
router.get   ('/bycandidate/:candidateId', authMiddleware, getByCandidate);
router.get   ('/bycompany/:companyId',    authMiddleware, getByCompany);
router.get   ('/:id',                  authMiddleware, getById);
router.post  ('/',                     authMiddleware, create);
router.patch ('/:id/restore',          authMiddleware, restoreInterview);
router.patch ('/',                     authMiddleware, patch);
router.delete('/:id',                  authMiddleware, removeInterview);

export default router;
