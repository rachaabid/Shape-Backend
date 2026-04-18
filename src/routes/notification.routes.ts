import { Router } from 'express';
import { getMyNotifications, markAsRead, markAllAsRead, deleteNotification } from '../controllers/notification.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get   ('/',           authMiddleware, getMyNotifications);
router.put   ('/read-all',   authMiddleware, markAllAsRead);
router.put   ('/:id/read',   authMiddleware, markAsRead);
router.delete('/:id',        authMiddleware, deleteNotification);

export default router;
