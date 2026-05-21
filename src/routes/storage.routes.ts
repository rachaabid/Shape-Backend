import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { uploadFile, streamStorageFile } from '../controllers/storage.controller';

const router = Router();

router.post('/', authMiddleware, ...uploadFile);
router.get('/:fileId', streamStorageFile);

export default router;
