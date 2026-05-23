import Notification from '../models/Notification';
import User         from '../models/User';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';

export const getMyNotifications = asyncHandler<AuthRequest>(async (req, res) =>
  res.json(await Notification.find({ userId: req.userId }).sort({ createdAt: -1 })));

export const markAsRead = asyncHandler<AuthRequest>(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params['id'], { read: true });
  res.json({ message: 'Notification lue' });
});

export const markAllAsRead = asyncHandler<AuthRequest>(async (req, res) => {
  await Notification.updateMany({ userId: req.userId, read: false }, { read: true });
  res.json({ message: 'Toutes les notifications lues' });
});

export const deleteNotification = asyncHandler<AuthRequest>(async (req, res) => {
  await Notification.findByIdAndDelete(req.params['id']);
  res.json({ message: 'Notification supprimée' });
});

export const getUnreadCount = asyncHandler<AuthRequest>(async (req, res) => {
  res.json({ total: await Notification.countDocuments({ userId: req.userId, read: false }) });
});

// ── Helpers réutilisables (pas des handlers HTTP) ─────────────────
export const createNotification = async (
  userId: string, type: string, message: string, data?: Record<string, unknown>,
): Promise<void> => {
  await Notification.create({ userId, type, message, data });
};

export const notifyAdmins = async (
  type: string, message: string, data?: Record<string, unknown>,
): Promise<void> => {
  const admins = await User.find({ roles: 'ADMIN', deleted: false }).select('_id');
  await Promise.all(admins.map(a => createNotification(a._id.toString(), type, message, data)));
};
