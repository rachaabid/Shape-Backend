import { Router } from 'express';
import { getMyNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification } from '../controllers/notification.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get   ('/',              authMiddleware, getMyNotifications);
router.get   ('/unread-count',  authMiddleware, getUnreadCount);
router.put   ('/read-all',      authMiddleware, markAllAsRead);
router.put   ('/:id/read',      authMiddleware, markAsRead);
router.delete('/:id',           authMiddleware, deleteNotification);

export default router;
