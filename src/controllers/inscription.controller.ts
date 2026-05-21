import { Request, Response } from 'express';
import Inscription from '../models/Inscription';
import { AuthRequest } from '../middleware/auth.middleware';

export const getMyMentor = async (req: AuthRequest, res: Response) => {
  try {
    const inscription = await Inscription.findOne({ user: req.userId, deleted: false })
      .populate('mentor', '-password')
      .populate('user', '-password');
    res.json(inscription ?? null);
  } catch (err) { res.status(500).json({ error: err }); }
};

export const countInscriptions = async (_req: Request, res: Response) => {
  try { res.json(await Inscription.countDocuments({ deleted: false })); }
  catch (err) { res.status(500).json({ error: err }); }
};

export const getInscriptionsByUser = async (req: Request, res: Response) => {
  try {
    const inscriptions = await Inscription.find({ user: req.params['userId'], deleted: false })
      .populate('user', '-password')
      .populate('programs');
    res.json(inscriptions);
  } catch (err) { res.status(500).json({ error: err }); }
};

export const getInscriptionsByMentor = async (req: Request, res: Response) => {
  try {
    const inscriptions = await Inscription.find({ mentor: req.params['mentorId'], deleted: false })
      .populate('user', '-password')
      .populate('programs');
    res.json(inscriptions);
  } catch (err) { res.status(500).json({ error: err }); }
};

export const getAllInscriptions = async (_req: Request, res: Response) => {
  try {
    res.json(await Inscription.find({ deleted: false }).populate('user', '-password').populate('programs'));
  } catch (err) { res.status(500).json({ error: err }); }
};

export const createInscription = async (req: Request, res: Response) => {
  try { res.status(201).json(await Inscription.create(req.body)); }
  catch (err) { res.status(500).json({ error: err }); }
};
