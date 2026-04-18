import { Router } from 'express';
import { matchCandidates, scheduleInterview, getInterviews } from '../controllers/ai.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get ('/match/:jobOfferId',  authMiddleware, matchCandidates);
router.post('/schedule',           authMiddleware, scheduleInterview);
router.get ('/interviews',         authMiddleware, getInterviews);

export default router;
