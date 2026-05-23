import Conversation from '../models/Conversation';
import Message      from '../models/Message';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';

const PARTICIPANT_FIELDS = 'firstName lastName login avatar role';

// GET /api/Conversation — mes conversations
export const getMyConversations = asyncHandler<AuthRequest>(async (req, res) => {
  res.json(
    await Conversation.find({ participants: req.userId })
      .populate('participants', PARTICIPANT_FIELDS)
      .sort({ lastMessageAt: -1 }),
  );
});

// POST /api/Conversation — créer ou récupérer une conversation avec un autre user
export const getOrCreateConversation = asyncHandler<AuthRequest>(async (req, res) => {
  const { participantId } = req.body;
  const myId = req.userId!;

  let convo = await Conversation.findOne({
    participants: { $all: [myId, participantId], $size: 2 },
  }).populate('participants', PARTICIPANT_FIELDS);

  if (!convo) {
    convo = await Conversation.create({ participants: [myId, participantId] });
    convo = await convo.populate('participants', PARTICIPANT_FIELDS);
  }
  res.json(convo);
});

// GET /api/Conversation/:id/messages
export const getMessages = asyncHandler<AuthRequest>(async (req, res) => {
  const { id } = req.params;
  const page  = parseInt(req.query['page']  as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 50;

  const messages = await Message.find({ conversationId: id })
    .populate('sender', 'firstName lastName login avatar')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  // Marquer les messages reçus comme lus + reset du compteur
  await Message.updateMany(
    { conversationId: id, sender: { $ne: req.userId }, read: false },
    { read: true },
  );
  await Conversation.findByIdAndUpdate(id, {
    $set: { [`unreadCounts.${req.userId}`]: 0 },
  });

  res.json(messages.reverse());
});

// GET /api/Conversation/unread-count
export const getUnreadMessageCount = asyncHandler<AuthRequest>(async (req, res) => {
  const convos = await Conversation.find({ participants: req.userId });
  const total = convos.reduce((sum, c) =>
    sum + ((c.unreadCounts as Map<string, number>).get(req.userId!) || 0), 0);
  res.json({ total });
});

// PATCH /api/Conversation/:id/read
export const markConversationRead = asyncHandler<AuthRequest>(async (req, res) => {
  const { id } = req.params;
  await Message.updateMany(
    { conversationId: id, sender: { $ne: req.userId }, read: false },
    { read: true },
  );
  await Conversation.findByIdAndUpdate(id, {
    $set: { [`unreadCounts.${req.userId}`]: 0 },
  });
  res.json({ message: 'Conversation marquée comme lue' });
});

// DELETE /api/Conversation/:id
export const deleteConversation = asyncHandler<AuthRequest>(async (req, res) => {
  await Conversation.findByIdAndUpdate(req.params['id'], { deleted: true });
  res.json({ message: 'Conversation supprimée' });
});
