import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  getMyMentor,
  countInscriptions,
  getInscriptionsByUser,
  getInscriptionsByMentor,
  getAllInscriptions,
  createInscription,
} from '../controllers/inscription.controller';

const router = Router();

router.get('/my-mentor',                  authMiddleware, getMyMentor as any);
router.get('/count',                      authMiddleware, countInscriptions);
router.get('/byattribute/User/:userId',   authMiddleware, getInscriptionsByUser);
router.get('/byattribute/Mentor/:mentorId', authMiddleware, getInscriptionsByMentor);
router.get('/',                           authMiddleware, getAllInscriptions);
router.post('/',                          authMiddleware, createInscription);

export default router;
