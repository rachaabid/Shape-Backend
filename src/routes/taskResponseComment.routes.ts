import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  countTaskResponseComments,
  getTaskResponseCommentsByAttribute,
  countTaskResponseCommentsByAttribute,
  getTaskResponseCommentById,
  getAllTaskResponseComments,
  createTaskResponseComment,
  updateTaskResponseComment,
  patchTaskResponseComment,
  deleteTaskResponseComment,
} from '../controllers/taskResponseComment.controller';

const router = Router();

// Note: path keeps original name (including typo) to avoid breaking existing callers
router.get('/TaskResponseCommentConroller/count',                                    authMiddleware, countTaskResponseComments);
router.get('/TaskResponseCommentConroller/ByAttribute/:attributeName/:value',        authMiddleware, getTaskResponseCommentsByAttribute);
router.get('/TaskResponseCommentConroller/ByAttributeCount/:attributeName/:value',   authMiddleware, countTaskResponseCommentsByAttribute);
router.get('/TaskResponseCommentConroller/:id',                                      authMiddleware, getTaskResponseCommentById);
router.get('/TaskResponseCommentConroller',                                          authMiddleware, getAllTaskResponseComments);
router.post('/TaskResponseCommentConroller',                                         authMiddleware, createTaskResponseComment as any);
router.put('/TaskResponseCommentConroller',                                          authMiddleware, updateTaskResponseComment);
router.patch('/TaskResponseCommentConroller',                                        authMiddleware, patchTaskResponseComment);
router.delete('/TaskResponseCommentConroller/:id',                                   authMiddleware, deleteTaskResponseComment);

export default router;
