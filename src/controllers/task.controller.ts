import Task from '../models/Task';
import TaskResponse from '../models/TaskResponse';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { HttpError }    from '../utils/HttpError';

// ── Task ─────────────────────────────────────────────────────

export const getTasks = asyncHandler(async (_req, res) => {
  res.json(await Task.find({ deleted: { $ne: true } }));
});

export const getTaskCount = asyncHandler(async (_req, res) => {
  res.json(await Task.countDocuments({ deleted: { $ne: true } }));
});

export const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params['id']);
  if (!task) throw HttpError.notFound('Tâche non trouvée');
  res.json(task);
});

export const getTaskByAttribute = asyncHandler(async (req, res) => {
  const { attributeName, value } = req.params;
  const tasks = await Task.find({ [attributeName]: value, deleted: { $ne: true } });
  res.json(tasks);
});

export const createTask = asyncHandler<AuthRequest>(async (req, res) => {
  res.status(201).json(await Task.create(req.body));
});

export const updateTask = asyncHandler<AuthRequest>(async (req, res) => {
  const { id, ...rest } = req.body;
  res.json(await Task.findByIdAndUpdate(id, rest, { new: true }));
});

export const patchTask = asyncHandler<AuthRequest>(async (req, res) => {
  const { id, ...rest } = req.body;
  res.json(await Task.findByIdAndUpdate(id, rest, { new: true }));
});

// ── TaskResponse ─────────────────────────────────────────────

export const getTaskResponses = asyncHandler(async (_req, res) => {
  res.json(await TaskResponse.find({ deleted: { $ne: true } }));
});

export const getTaskResponseById = asyncHandler(async (req, res) => {
  const r = await TaskResponse.findById(req.params['id']).populate('task');
  if (!r) throw HttpError.notFound();
  res.json(r);
});

export const getTaskResponseByAttribute = asyncHandler(async (req, res) => {
  const { value } = req.params;
  const attr = req.params['attributeName'].toLowerCase();
  const filter: Record<string, unknown> = { deleted: { $ne: true } };
  if (attr === 'task')        filter['task']        = value;
  if (attr === 'inscription') filter['inscription'] = value;
  if (attr === 'status')      filter['status']      = Number(value);
  const results = await TaskResponse.find(filter).populate('task').populate('owner', '-password');
  res.json(results);
});

export const getTaskResponseCountByAttribute = asyncHandler(async (req, res) => {
  const { attributeName, value } = req.params;
  const filter: Record<string, unknown> = { deleted: { $ne: true } };
  if (attributeName === 'status') filter['status'] = Number(value);
  else filter[attributeName] = value;
  res.json(await TaskResponse.countDocuments(filter));
});

export const createTaskResponse = asyncHandler<AuthRequest>(async (req, res) => {
  res.status(201).json(await TaskResponse.create({
    ...req.body,
    owner: req.body.owner || req.userId,
  }));
});

export const updateTaskResponse = asyncHandler<AuthRequest>(async (req, res) => {
  const { id, ...rest } = req.body;
  res.json(await TaskResponse.findByIdAndUpdate(id, rest, { new: true }));
});

export const patchTaskResponse = asyncHandler<AuthRequest>(async (req, res) => {
  const { id, status } = req.body;
  res.json(await TaskResponse.findByIdAndUpdate(id, { status }, { new: true }));
});

export const addFileToTaskResponse = asyncHandler<AuthRequest>(async (req, res) => {
  const { id } = req.params;
  const { name, url } = req.body;
  const updated = await TaskResponse.findByIdAndUpdate(
    id,
    { $push: { files: { name, url } } },
    { new: true },
  ).populate('task').populate('owner', '-password');
  if (!updated) throw HttpError.notFound('Réponse non trouvée');
  res.json(updated);
});

export const removeFileFromTaskResponse = asyncHandler<AuthRequest>(async (req, res) => {
  const { id } = req.params;
  const fileIndex = parseInt(req.params['fileIndex'], 10);
  const response = await TaskResponse.findById(id);
  if (!response) throw HttpError.notFound('Réponse non trouvée');
  if (response.files && fileIndex >= 0 && fileIndex < response.files.length) {
    response.files.splice(fileIndex, 1);
    await response.save();
  }
  res.json(response);
});
