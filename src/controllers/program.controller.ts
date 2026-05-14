import { Request, Response } from 'express';
import Program from '../models/Program';
import { AuthRequest } from '../middleware/auth.middleware';

export const getPrograms = async (req: Request, res: Response) => {
  try {
    const start = parseInt(req.query['start'] as string) || 0;
    const count = parseInt(req.query['count'] as string) || 100;
    const programs = await Program.find({ deleted: { $ne: true } }).skip(start).limit(count);
    res.json(programs);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// GET /api/Program/mine — programs created by the logged-in mentor
export const getMyPrograms = async (req: AuthRequest, res: Response) => {
  try {
    const programs = await Program.find({ owner: req.userId, deleted: { $ne: true } });
    res.json(programs);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

export const getProgramById = async (req: Request, res: Response) => {
  try {
    const program = await Program.findById(req.params['id']);
    if (!program) return res.status(404).json({ message: 'Program introuvable' });
    res.json(program);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

export const countPrograms = async (req: Request, res: Response) => {
  try {
    const count = await Program.countDocuments({ deleted: { $ne: true } });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

export const createProgram = async (req: AuthRequest, res: Response) => {
  try {
    const program = await Program.create({ ...req.body, owner: req.userId });
    res.status(201).json(program);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

export const updateProgram = async (req: Request, res: Response) => {
  try {
    const { id, ...data } = req.body;
    const program = await Program.findByIdAndUpdate(id, data, { new: true });
    if (!program) return res.status(404).json({ message: 'Program introuvable' });
    res.json(program);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

export const deleteProgram = async (req: Request, res: Response) => {
  try {
    await Program.findByIdAndUpdate(req.params['id'], { deleted: true });
    res.json({ message: 'Program supprimé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};
