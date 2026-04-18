import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/notificationSetting.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/NotificationSetting', authMiddleware, getSettings);
router.put('/NotificationSetting', authMiddleware, updateSettings);

export default router;
