import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  countQuizzes, getQuizzesByAttribute, countQuizzesByAttribute,
  getQuizById, getAllQuizzes, createQuiz, updateQuiz, patchQuiz, deleteQuiz,
  countQuizResponses, getQuizResponsesByAttribute, countQuizResponsesByAttribute,
  getQuizResponseById, getAllQuizResponses, createQuizResponse,
  updateQuizResponse, patchQuizResponse, deleteQuizResponse,
} from '../controllers/quiz.controller';

const router = Router();

// ── Quiz ──────────────────────────────────────────────────────
router.get('/Quiz/count',                                    authMiddleware, countQuizzes);
router.get('/Quiz/ByAttribute/:attributeName/:value',        authMiddleware, getQuizzesByAttribute);
router.get('/Quiz/ByAttributeCount/:attributeName/:value',   authMiddleware, countQuizzesByAttribute);
router.get('/Quiz/:id',                                      authMiddleware, getQuizById);
router.get('/Quiz',                                          authMiddleware, getAllQuizzes);
router.post('/Quiz',                                         authMiddleware, createQuiz);
router.put('/Quiz',                                          authMiddleware, updateQuiz);
router.patch('/Quiz',                                        authMiddleware, patchQuiz);
router.delete('/Quiz/:id',                                   authMiddleware, deleteQuiz);

// ── QuizResponse ──────────────────────────────────────────────
router.get('/QuizResponse/count',                            authMiddleware, countQuizResponses);
router.get('/QuizResponse/ByAttribute/:attributeName/:value',      authMiddleware, getQuizResponsesByAttribute);
router.get('/QuizResponse/ByAttributeCount/:attributeName/:value', authMiddleware, countQuizResponsesByAttribute);
router.get('/QuizResponse/:id',                              authMiddleware, getQuizResponseById);
router.get('/QuizResponse',                                  authMiddleware, getAllQuizResponses);
router.post('/QuizResponse',                                 authMiddleware, createQuizResponse as any);
router.put('/QuizResponse',                                  authMiddleware, updateQuizResponse);
router.patch('/QuizResponse',                                authMiddleware, patchQuizResponse);
router.delete('/QuizResponse/:id',                           authMiddleware, deleteQuizResponse);

export default router;
