import { Router } from 'express';
import { getByCompany, getById, create, patch, confirm } from '../controllers/interview.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get   ('/confirm',              confirm);                         // public — email link
router.get   ('/bycompany/:companyId', authMiddleware, getByCompany);
router.get   ('/:id',                  authMiddleware, getById);
router.post  ('/',                     authMiddleware, create);
router.patch ('/',                     authMiddleware, patch);

export default router;
