import { Router } from 'express';
import {
  getMyConversations,
  getOrCreateConversation,
  getMessages,
  getUnreadMessageCount,
} from '../controllers/conversation.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get ('/',              authMiddleware, getMyConversations);
router.post('/',              authMiddleware, getOrCreateConversation);
router.get ('/unread-count',  authMiddleware, getUnreadMessageCount);
router.get ('/:id/messages',  authMiddleware, getMessages);

export default router;
