import NotificationSetting from '../models/NotificationSetting';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';

export const getSettings = asyncHandler<AuthRequest>(async (req, res) => {
  const s = await NotificationSetting.findOne({ userId: req.userId });
  res.json(s || {});
});

export const updateSettings = asyncHandler<AuthRequest>(async (req, res) => {
  const s = await NotificationSetting.findOneAndUpdate(
    { userId: req.userId }, req.body, { new: true, upsert: true },
  );
  res.json(s);
});
