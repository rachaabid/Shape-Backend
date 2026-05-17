import { Router } from 'express';
import { getByCandidate, getByCompany, getById, create, patch, confirm, getInterviews } from '../controllers/interview.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get   ('/',                     authMiddleware, getInterviews);   // admin — tous les entretiens
router.get   ('/confirm',              confirm);                         // public — email link
router.get   ('/bycandidate/:candidateId', authMiddleware, getByCandidate);
router.get   ('/bycompany/:companyId',    authMiddleware, getByCompany);
router.get   ('/:id',                  authMiddleware, getById);
router.post  ('/',                     authMiddleware, create);
router.patch ('/',                     authMiddleware, patch);

export default router;
