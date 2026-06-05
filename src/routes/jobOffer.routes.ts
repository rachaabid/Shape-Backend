import { Router } from 'express';
import {
  getAll, getClosed, reopen, getCount, getByAttribute, getCountByAttribute,
  getEvaluatedByUser, getById, create, update, patch, remove,
  triggerMatchForCompany,
} from '../controllers/jobOffer.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get   ('/closed',                             authMiddleware, getClosed);
router.get   ('/count',                              authMiddleware, getCount);
router.get   ('/EvaluateByUser/:userId',             authMiddleware, getEvaluatedByUser);
router.get   ('/byattribute/:attributeName/:value',  authMiddleware, getByAttribute);
router.get   ('/ByAttributeCount/:attributeName/:value', authMiddleware, getCountByAttribute);
router.get   ('/:id',                                authMiddleware, getById);
router.get   ('/',                                   authMiddleware, getAll);
router.post  ('/triggerMatchForCompany/:companyId',  authMiddleware, triggerMatchForCompany);
router.post  ('/',                                   authMiddleware, create);
router.put   ('/',                                   authMiddleware, update);
router.patch ('/:id/reopen',                         authMiddleware, reopen);
router.patch ('/',                                   authMiddleware, patch);
router.delete('/:id',                               authMiddleware, remove);

export default router;
