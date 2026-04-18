import { Router } from 'express';
import { getByOwner, getById, createCompany, updateCompany, patchCompany, deleteCompany } from '../controllers/company.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get   ('/byattribute/owner/:userId', authMiddleware, getByOwner);
router.get   ('/:id',                       authMiddleware, getById);
router.post  ('/',                          authMiddleware, createCompany);
router.put   ('/',                          authMiddleware, updateCompany);
router.patch ('/',                          authMiddleware, patchCompany);
router.delete('/:id',                      authMiddleware, deleteCompany);

export default router;
