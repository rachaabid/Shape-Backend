import { Router } from 'express';
import {
  authenticate, createUser, getUserById,
  updateUser, patchUser, deleteUser, resetPassword, authenticateRecovery,
  getCandidateUsers, getAllUsers, validateUserAccount, rejectUserAccount,
  getArchivedUsers, archiveUser, unarchiveUser,
} from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Auth
router.post('/Authenticate',                          authenticate);
router.get ('/ResetPassword/:email',                  resetPassword);
router.get ('/authenticaterecovery/:email/:code',     authenticateRecovery);

// CRUD
router.post('/',           createUser);
router.get ('/archived',   authMiddleware, getArchivedUsers);
router.get ('/',           authMiddleware, getAllUsers);
router.get ('/candidates', authMiddleware, getCandidateUsers);
router.patch('/:id/validate',  authMiddleware, validateUserAccount);
router.patch('/:id/reject',    authMiddleware, rejectUserAccount);
router.patch('/:id/archive',   authMiddleware, archiveUser);
router.patch('/:id/unarchive', authMiddleware, unarchiveUser);
router.get ('/:id',        authMiddleware, getUserById);
router.put ('/',    authMiddleware, updateUser);
router.patch('/',   authMiddleware, patchUser);
router.delete('/:id', authMiddleware, deleteUser);

export default router;
