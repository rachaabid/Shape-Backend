import Notification from '../models/Notification';
import User         from '../models/User';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';

const MENTOR_TYPES    = ['TASK_IN_REVIEW', 'TASK_FILE_UPLOADED', 'NEW_INTERN_INSCRIBED', 'NEW_INTERVIEW', 'NEW_MESSAGE'];
const CANDIDATE_TYPES = ['EVALUATION_RECEIVED', 'EVALUATION_UPDATED', 'CANDIDATE_RETAINED', 'APPLICATION_RETAINED', 'APPLICATION_REJECTED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_CONFIRMED', 'NEW_MESSAGE', 'TRAINING_VALIDATED'];
const COMPANY_TYPES   = ['NEW_APPLICATION', 'NEW_MESSAGE', 'CANDIDATE_RETAINED'];

function allowedTypes(roles: string[]): string[] | null {
  if (roles.includes('ADMIN')) return null; // null = pas de filtre (tout voir)
  const types = new Set<string>();
  if (roles.includes('MENTOR'))    MENTOR_TYPES.forEach(t => types.add(t));
  if (roles.includes('CANDIDATE')) CANDIDATE_TYPES.forEach(t => types.add(t));
  if (roles.includes('COMPANY'))   COMPANY_TYPES.forEach(t => types.add(t));
  return [...types];
}

export const getMyNotifications = asyncHandler<AuthRequest>(async (req, res) => {
  const types = allowedTypes(req.userRoles || []);
  const query: any = { userId: req.userId };
  if (types !== null) query.type = { $in: types };
  res.json(await Notification.find(query).sort({ createdAt: -1 }));
});

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
  const types = allowedTypes(req.userRoles || []);
  const query: any = { userId: req.userId, read: false };
  if (types !== null) query.type = { $in: types };
  res.json({ total: await Notification.countDocuments(query) });
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
