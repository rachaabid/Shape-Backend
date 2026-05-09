import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  getMyInterns,
  getMentorStats,
  getInternTaskResponses,
  getMentorTasks,
  createMentorTask,
  deleteMentorTask,
  getEvaluations,
  getMyEvaluations,
  createEvaluation,
  updateEvaluation,
  deleteEvaluation,
  assignMentor,
  getMentors,
  createMentor,
} from '../controllers/mentor.controller';

const router = Router();

// ── Mentor: my data ──────────────────────────────────────────────
router.get('/interns',                     authMiddleware, getMyInterns);
router.get('/stats',                       authMiddleware, getMentorStats);
router.get('/tasks',                       authMiddleware, getMentorTasks);
router.post('/tasks',                      authMiddleware, createMentorTask);
router.delete('/tasks/:id',               authMiddleware, deleteMentorTask);
router.get('/interns/:internId/tasks',    authMiddleware, getInternTaskResponses);
router.get('/evaluations/mine',           authMiddleware, getMyEvaluations);
router.get('/evaluations/:internId',      authMiddleware, getEvaluations);
router.post('/evaluation',                authMiddleware, createEvaluation);
router.put('/evaluation',                 authMiddleware, updateEvaluation);
router.delete('/evaluation/:id',         authMiddleware, deleteEvaluation);

// ── Admin ────────────────────────────────────────────────────────
router.get('/all',                         authMiddleware, getMentors);
router.post('/create',                     authMiddleware, createMentor);
router.post('/assign',                     authMiddleware, assignMentor);

export default router;
