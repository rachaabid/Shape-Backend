import { Request, Response } from 'express';
import TaskResponseComment from '../models/TaskResponseComment';
import { AuthRequest } from '../middleware/auth.middleware';

export const countTaskResponseComments = async (_req: Request, res: Response) => {
  try { res.json(await TaskResponseComment.countDocuments({ deleted: { $ne: true } })); }
  catch (err) { res.status(500).json({ error: err }); }
};

export const getTaskResponseCommentsByAttribute = async (req: Request, res: Response) => {
  try {
    const { attributeName, value } = req.params;
    const start = parseInt(req.query['start'] as string) || 0;
    const count = parseInt(req.query['count'] as string) || 100;
    const filter: Record<string, unknown> = { deleted: { $ne: true } };
    if (attributeName === 'taskResponse') filter['taskResponse'] = value;
    if (attributeName === 'user')         filter['user']         = value;
    if (attributeName === 'owner')        filter['owner']        = value;
    const items = await TaskResponseComment.find(filter)
      .populate('user', '-password')
      .skip(start).limit(count);
    res.json(items);
  } catch (err) { res.status(500).json({ error: err }); }
};

export const countTaskResponseCommentsByAttribute = async (req: Request, res: Response) => {
  try {
    const { attributeName, value } = req.params;
    res.json(await TaskResponseComment.countDocuments({ [attributeName]: value, deleted: { $ne: true } }));
  } catch (err) { res.status(500).json({ error: err }); }
};

export const getTaskResponseCommentById = async (req: Request, res: Response) => {
  try {
    const item = await TaskResponseComment.findById(req.params.id)
      .populate('user', '-password')
      .populate('taskResponse');
    if (!item) { res.status(404).json({ message: 'Non trouvé' }); return; }
    res.json(item);
  } catch (err) { res.status(500).json({ error: err }); }
};

export const getAllTaskResponseComments = async (_req: Request, res: Response) => {
  try {
    res.json(await TaskResponseComment.find({ deleted: { $ne: true } }).populate('user', '-password'));
  } catch (err) { res.status(500).json({ error: err }); }
};

export const createTaskResponseComment = async (req: AuthRequest, res: Response) => {
  try {
    const item = await TaskResponseComment.create({
      ...req.body,
      owner: req.body.owner || req.userId,
      user:  req.body.user  || req.userId,
    });
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: err }); }
};

export const updateTaskResponseComment = async (req: Request, res: Response) => {
  try {
    const { id, ...rest } = req.body;
    res.json(await TaskResponseComment.findByIdAndUpdate(id, rest, { new: true }));
  } catch (err) { res.status(500).json({ error: err }); }
};

export const patchTaskResponseComment = async (req: Request, res: Response) => {
  try {
    const { id, ...rest } = req.body;
    res.json(await TaskResponseComment.findByIdAndUpdate(id, { $set: rest }, { new: true }));
  } catch (err) { res.status(500).json({ error: err }); }
};

export const deleteTaskResponseComment = async (req: Request, res: Response) => {
  try {
    await TaskResponseComment.findByIdAndUpdate(req.params.id, { deleted: true });
    res.json({ message: 'Supprimé' });
  } catch (err) { res.status(500).json({ error: err }); }
};
