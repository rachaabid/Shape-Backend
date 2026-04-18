import { Response } from 'express';
import NotificationSetting from '../models/NotificationSetting';
import { AuthRequest } from '../middleware/auth.middleware';

export const getSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const s = await NotificationSetting.findOne({ userId: req.userId });
    res.json(s || {});
  } catch (err) { res.status(500).json({ error: err }); }
};

export const updateSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const s = await NotificationSetting.findOneAndUpdate(
      { userId: req.userId },
      req.body,
      { new: true, upsert: true }
    );
    res.json(s);
  } catch (err) { res.status(500).json({ error: err }); }
};
