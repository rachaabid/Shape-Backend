import { Router } from 'express';
import {
  authenticate, createUser, getUserById,
  updateUser, patchUser, deleteUser, resetPassword, authenticateRecovery,
} from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Auth
router.post('/Authenticate',                          authenticate);
router.get ('/ResetPassword/:email',                  resetPassword);
router.get ('/authenticaterecovery/:email/:code',     authenticateRecovery);

// CRUD
router.post('/',    createUser);
router.get ('/:id', authMiddleware, getUserById);
router.put ('/',    authMiddleware, updateUser);
router.patch('/',   authMiddleware, patchUser);
router.delete('/:id', authMiddleware, deleteUser);

export default router;
