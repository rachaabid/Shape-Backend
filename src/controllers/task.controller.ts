import { Request, Response } from 'express';
import Task from '../models/Task';
import TaskResponse from '../models/TaskResponse';
import { AuthRequest } from '../middleware/auth.middleware';

// ── Task ─────────────────────────────────────────────────────

export const getTasks = async (_req: Request, res: Response): Promise<void> => {
  try { res.json(await Task.find({ deleted: false })); }
  catch (err) { res.status(500).json({ error: err }); }
};

export const getTaskCount = async (_req: Request, res: Response): Promise<void> => {
  try { res.json(await Task.countDocuments({ deleted: false })); }
  catch (err) { res.status(500).json({ error: err }); }
};

export const getTaskById = async (req: Request, res: Response): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) { res.status(404).json({ message: 'Tâche non trouvée' }); return; }
    res.json(task);
  } catch (err) { res.status(500).json({ error: err }); }
};

export const getTaskByAttribute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { attributeName, value } = req.params;
    const tasks = await Task.find({ [attributeName]: value, deleted: false });
    res.json(tasks);
  } catch (err) { res.status(500).json({ error: err }); }
};

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try { res.status(201).json(await Task.create(req.body)); }
  catch (err) { res.status(500).json({ error: err }); }
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, ...rest } = req.body;
    res.json(await Task.findByIdAndUpdate(id, rest, { new: true }));
  } catch (err) { res.status(500).json({ error: err }); }
};

export const patchTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, ...rest } = req.body;
    res.json(await Task.findByIdAndUpdate(id, rest, { new: true }));
  } catch (err) { res.status(500).json({ error: err }); }
};

// ── TaskResponse ─────────────────────────────────────────────

export const getTaskResponses = async (_req: Request, res: Response): Promise<void> => {
  try { res.json(await TaskResponse.find({ deleted: false })); }
  catch (err) { res.status(500).json({ error: err }); }
};

export const getTaskResponseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const r = await TaskResponse.findById(req.params.id).populate('task');
    if (!r) { res.status(404).json({ message: 'Non trouvé' }); return; }
    res.json(r);
  } catch (err) { res.status(500).json({ error: err }); }
};

export const getTaskResponseByAttribute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { attributeName, value } = req.params;
    const filter: Record<string, unknown> = { deleted: false };
    if (attributeName === 'task')        filter['task']        = value;
    if (attributeName === 'inscription') filter['inscription'] = value;
    if (attributeName === 'status')      filter['status']      = Number(value);
    const results = await TaskResponse.find(filter).populate('task').populate('owner', '-password');
    res.json(results);
  } catch (err) { res.status(500).json({ error: err }); }
};

export const getTaskResponseCountByAttribute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { attributeName, value } = req.params;
    const filter: Record<string, unknown> = { deleted: false };
    if (attributeName === 'status') filter['status'] = Number(value);
    else filter[attributeName] = value;
    res.json(await TaskResponse.countDocuments(filter));
  } catch (err) { res.status(500).json({ error: err }); }
};

export const createTaskResponse = async (req: AuthRequest, res: Response): Promise<void> => {
  try { res.status(201).json(await TaskResponse.create({ ...req.body, owner: req.body.owner || req.userId })); }
  catch (err) { res.status(500).json({ error: err }); }
};

export const updateTaskResponse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, ...rest } = req.body;
    res.json(await TaskResponse.findByIdAndUpdate(id, rest, { new: true }));
  } catch (err) { res.status(500).json({ error: err }); }
};

export const patchTaskResponse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, status } = req.body;
    res.json(await TaskResponse.findByIdAndUpdate(id, { status }, { new: true }));
  } catch (err) { res.status(500).json({ error: err }); }
};
