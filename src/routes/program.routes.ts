import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  getPrograms, getProgramById, countPrograms,
  createProgram, updateProgram, deleteProgram,
} from '../controllers/program.controller';

const router = Router();

router.get   ('/count', authMiddleware, countPrograms);
router.get   ('/:id',   authMiddleware, getProgramById);
router.get   ('/',      authMiddleware, getPrograms);
router.post  ('/',      authMiddleware, createProgram);
router.put   ('/',      authMiddleware, updateProgram);
router.delete('/:id',   authMiddleware, deleteProgram);

export default router;
