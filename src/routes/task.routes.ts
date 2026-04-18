import { Router } from 'express';
import {
  getTasks, getTaskCount, getTaskById, getTaskByAttribute,
  createTask, updateTask, patchTask,
  getTaskResponses, getTaskResponseById, getTaskResponseByAttribute,
  getTaskResponseCountByAttribute, createTaskResponse, updateTaskResponse, patchTaskResponse,
} from '../controllers/task.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Task
router.get   ('/Task/count',                                authMiddleware, getTaskCount);
router.get   ('/Task/ByAttribute/:attributeName/:value',    authMiddleware, getTaskByAttribute);
router.get   ('/Task/:id',                                  authMiddleware, getTaskById);
router.get   ('/Task',                                      authMiddleware, getTasks);
router.post  ('/Task',                                      authMiddleware, createTask);
router.put   ('/Task',                                      authMiddleware, updateTask);
router.patch ('/Task',                                      authMiddleware, patchTask);

// TaskResponse
router.get   ('/TaskResponse/ByAttribute/:attributeName/:value',      authMiddleware, getTaskResponseByAttribute);
router.get   ('/TaskResponse/ByAttributeCount/:attributeName/:value', authMiddleware, getTaskResponseCountByAttribute);
router.get   ('/TaskResponse/:id',                                    authMiddleware, getTaskResponseById);
router.get   ('/TaskResponse',                                        authMiddleware, getTaskResponses);
router.post  ('/TaskResponse',                                        authMiddleware, createTaskResponse);
router.put   ('/TaskResponse',                                        authMiddleware, updateTaskResponse);
router.patch ('/TaskResponse',                                        authMiddleware, patchTaskResponse);

export default router;
