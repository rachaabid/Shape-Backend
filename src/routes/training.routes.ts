import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  getTrainings, getTrainingById, countTrainings,
  createTraining, updateTraining, deleteTraining, getMyTrainings,
  getMentorAllTrainings, getTrainingsByOwner,
  getArchivedTrainings, archiveTraining, unarchiveTraining,
} from '../controllers/training.controller';

const router = Router();

router.get   ('/mentor-all',        authMiddleware, getMentorAllTrainings);
router.get   ('/by-owner/:ownerId', authMiddleware, getTrainingsByOwner);
router.get   ('/mine',              authMiddleware, getMyTrainings);
router.get   ('/archived', authMiddleware, getArchivedTrainings);
router.get   ('/count',    authMiddleware, countTrainings);
router.get   ('/:id',      authMiddleware, getTrainingById);
router.get   ('/',         getTrainings); // public — needed during signup training selection
router.post  ('/',         authMiddleware, createTraining);
router.put   ('/',         authMiddleware, updateTraining);
router.patch ('/:id/archive',   authMiddleware, archiveTraining);
router.patch ('/:id/unarchive', authMiddleware, unarchiveTraining);
router.delete('/:id',      authMiddleware, deleteTraining);

export default router;
