import { Response } from 'express';
import Conversation from '../models/Conversation';
import Message      from '../models/Message';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /api/Conversation — mes conversations
export const getMyConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const conversations = await Conversation.find({ participants: req.userId })
      .populate('participants', 'firstName lastName login avatar role')
      .sort({ lastMessageAt: -1 });
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// POST /api/Conversation — créer ou récupérer une conversation avec un autre user
export const getOrCreateConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { participantId } = req.body;
    const myId = req.userId!;

    // Chercher conversation existante
    let convo = await Conversation.findOne({
      participants: { $all: [myId, participantId], $size: 2 },
    }).populate('participants', 'firstName lastName login avatar role');

    if (!convo) {
      convo = await Conversation.create({ participants: [myId, participantId] });
      convo = await convo.populate('participants', 'firstName lastName login avatar role');
    }

    res.json(convo);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// GET /api/Conversation/:id/messages — messages d'une conversation
export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const page  = parseInt(req.query['page']  as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 50;

    const messages = await Message.find({ conversationId: id })
      .populate('sender', 'firstName lastName login avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Marquer les messages non lus comme lus
    await Message.updateMany(
      { conversationId: id, sender: { $ne: req.userId }, read: false },
      { read: true },
    );

    // Reset unreadCount pour cet user dans la conversation
    await Conversation.findByIdAndUpdate(id, {
      $set: { [`unreadCounts.${req.userId}`]: 0 },
    });

    res.json(messages.reverse()); // ordre chronologique
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// GET /api/Conversation/unread-count — total messages non lus
export const getUnreadMessageCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const convos = await Conversation.find({ participants: req.userId });
    let total = 0;
    for (const c of convos) {
      total += (c.unreadCounts as Map<string, number>).get(req.userId!) || 0;
    }
    res.json({ total });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};
