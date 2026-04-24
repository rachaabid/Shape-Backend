import { Router } from 'express';
import { getRtcToken, getRtmToken } from '../controllers/agora.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/rtc-token', authMiddleware, getRtcToken);
router.get('/rtm-token', authMiddleware, getRtmToken);

export default router;
