import TaskResponseComment from '../models/TaskResponseComment';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { HttpError }    from '../utils/HttpError';

export const countTaskResponseComments = asyncHandler(async (_req, res) => {
  res.json(await TaskResponseComment.countDocuments({ deleted: { $ne: true } }));
});

export const getTaskResponseCommentsByAttribute = asyncHandler(async (req, res) => {
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
});

export const countTaskResponseCommentsByAttribute = asyncHandler(async (req, res) => {
  const { attributeName, value } = req.params;
  res.json(await TaskResponseComment.countDocuments({ [attributeName]: value, deleted: { $ne: true } }));
});

export const getTaskResponseCommentById = asyncHandler(async (req, res) => {
  const item = await TaskResponseComment.findById(req.params['id'])
    .populate('user', '-password')
    .populate('taskResponse');
  if (!item) throw HttpError.notFound();
  res.json(item);
});

export const getAllTaskResponseComments = asyncHandler(async (_req, res) => {
  res.json(
    await TaskResponseComment.find({ deleted: { $ne: true } }).populate('user', '-password'),
  );
});

export const createTaskResponseComment = asyncHandler<AuthRequest>(async (req, res) => {
  const item = await TaskResponseComment.create({
    ...req.body,
    owner: req.body.owner || req.userId,
    user:  req.body.user  || req.userId,
  });
  res.status(201).json(item);
});

export const updateTaskResponseComment = asyncHandler(async (req, res) => {
  const { id, ...rest } = req.body;
  res.json(await TaskResponseComment.findByIdAndUpdate(id, rest, { new: true }));
});

export const patchTaskResponseComment = asyncHandler(async (req, res) => {
  const { id, ...rest } = req.body;
  res.json(await TaskResponseComment.findByIdAndUpdate(id, { $set: rest }, { new: true }));
});

export const deleteTaskResponseComment = asyncHandler(async (req, res) => {
  await TaskResponseComment.findByIdAndUpdate(req.params['id'], { deleted: true });
  res.json({ message: 'Supprimé' });
});
