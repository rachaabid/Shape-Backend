import { Router } from 'express';
import {
  getAll, getArchived, archive, unarchive, getCount, getByAttribute,
  getCountByAttribute, getById, create, update, patch, remove,
} from '../controllers/application.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get   ('/archived',                           authMiddleware, getArchived);
router.get   ('/count',                              authMiddleware, getCount);
router.get   ('/byattribute/:attributeName/:value',  authMiddleware, getByAttribute);
router.get   ('/ByAttributeCount/:attributeName/:value', authMiddleware, getCountByAttribute);
router.get   ('/:id',                                authMiddleware, getById);
router.get   ('/',                                   authMiddleware, getAll);
router.post  ('/',                                   authMiddleware, create);
router.put   ('/',                                   authMiddleware, update);
router.patch ('/:id/archive',                        authMiddleware, archive);
router.patch ('/:id/unarchive',                      authMiddleware, unarchive);
router.patch ('/',                                   authMiddleware, patch);
router.delete('/:id',                               authMiddleware, remove);

export default router;
