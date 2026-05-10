import { Request, Response } from 'express';
import ProgramRequest        from '../models/ProgramRequest';
import Inscription           from '../models/Inscription';
import User                  from '../models/User';
import { AuthRequest }       from '../middleware/auth.middleware';
import { sendProgramApproved, sendProgramRejected } from '../services/email.service';

export const getAll = async (_req: Request, res: Response): Promise<void> => {
  try {
    const requests = await ProgramRequest.find({ deleted: { $ne: true } })
      .populate('user',        '-password')
      .populate('program')
      .populate('inscription');
    res.json(requests);
  } catch (err) { res.status(500).json({ error: err }); }
};

export const getMine = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requests = await ProgramRequest.find({ user: req.userId, deleted: { $ne: true } })
      .populate('program');
    res.json(requests);
  } catch (err) { res.status(500).json({ error: err }); }
};

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { program, inscription } = req.body;
    // Prevent duplicate pending requests
    const existing = await ProgramRequest.findOne({
      user: req.userId,
      program,
      inscription,
      status: 'pending',
      deleted: { $ne: true },
    });
    if (existing) {
      res.status(409).json({ message: 'Demande déjà en attente pour ce programme.' });
      return;
    }
    const request = await ProgramRequest.create({ user: req.userId, program, inscription });
    res.status(201).json(request);
  } catch (err) { res.status(500).json({ error: err }); }
};

export const approve = async (req: Request, res: Response): Promise<void> => {
  try {
    const request = await ProgramRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    ).populate('user', 'email firstName lastName login').populate('program', 'title');
    if (!request) { res.status(404).json({ message: 'Demande non trouvée.' }); return; }

    await Inscription.findByIdAndUpdate(
      request.inscription,
      { $addToSet: { programs: request.program } }
    );

    res.json(request);

    setImmediate(() => {
      const u = request.user as any;
      const p = request.program as any;
      const userName    = u?.firstName?.fr || u?.firstName?.en || u?.login || u?.email || '';
      const programTitle = p?.title?.fr   || p?.title?.en    || p?.title?.ar || '';
      const frontendUrl  = process.env.FRONTEND_URL || 'http://localhost:4200';
      if (u?.email && programTitle) {
        sendProgramApproved({ userEmail: u.email, userName, programTitle, frontendUrl }).catch(() => {});
      }
    });
  } catch (err) { res.status(500).json({ error: err }); }
};

export const reject = async (req: Request, res: Response): Promise<void> => {
  try {
    const request = await ProgramRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    ).populate('user', 'email firstName lastName login').populate('program', 'title');
    if (!request) { res.status(404).json({ message: 'Demande non trouvée.' }); return; }
    res.json(request);

    setImmediate(() => {
      const u = request.user as any;
      const p = request.program as any;
      const userName     = u?.firstName?.fr || u?.firstName?.en || u?.login || u?.email || '';
      const programTitle = p?.title?.fr    || p?.title?.en    || p?.title?.ar || '';
      const frontendUrl  = process.env.FRONTEND_URL || 'http://localhost:4200';
      if (u?.email && programTitle) {
        sendProgramRejected({ userEmail: u.email, userName, programTitle, frontendUrl }).catch(() => {});
      }
    });
  } catch (err) { res.status(500).json({ error: err }); }
};
