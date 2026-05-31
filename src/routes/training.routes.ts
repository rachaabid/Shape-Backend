import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  getTrainings, getTrainingById, countTrainings,
  createTraining, updateTraining, deleteTraining, getMyTrainings,
} from '../controllers/training.controller';

const router = Router();

router.get   ('/mine',  authMiddleware, getMyTrainings);
router.get   ('/count', authMiddleware, countTrainings);
router.get   ('/:id',   authMiddleware, getTrainingById);
router.get   ('/',      getTrainings); // public — needed during signup training selection
router.post  ('/',      authMiddleware, createTraining);
router.put   ('/',      authMiddleware, updateTraining);
router.delete('/:id',   authMiddleware, deleteTraining);

export default router;
