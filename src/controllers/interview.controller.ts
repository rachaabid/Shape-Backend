import { Request, Response } from 'express';
import crypto from 'crypto';
import Interview from '../models/Interview';
import Application from '../models/JobOfferApplication';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /api/Interview/bycompany/:companyId
export const getByCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const interviews = await Interview.find({ companyId: req.params.companyId })
      .populate('candidateId', '-password')
      .populate('jobOfferId')
      .sort({ scheduledAt: 1 });
    res.json(interviews);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// GET /api/Interview/:id
export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('candidateId', '-password')
      .populate('jobOfferId');
    if (!interview) { res.status(404).json({ message: 'Entretien non trouvé' }); return; }
    res.json(interview);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// POST /api/Interview
export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const confirmToken = crypto.randomBytes(32).toString('hex');
    const interview = await Interview.create({ ...req.body, confirmToken });
    res.status(201).json(interview);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// PATCH /api/Interview
export const patch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, ...rest } = req.body;
    const interview = await Interview.findByIdAndUpdate(id, rest, { new: true });
    res.json(interview);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// GET /api/Interview/confirm?token=xxx&party=candidate|company
// Called from confirmation email link — no auth required
export const confirm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, party } = req.query as { token: string; party: string };
    if (!token || !['candidate', 'company'].includes(party)) {
      res.status(400).json({ message: 'Paramètres invalides' });
      return;
    }

    const interview = await Interview.findOne({ confirmToken: token });
    if (!interview) { res.status(404).json({ message: 'Entretien non trouvé' }); return; }

    if (party === 'candidate') interview.confirmedByCandidate = true;
    if (party === 'company')   interview.confirmedByCompany   = true;

    // When company confirms → set status to Interview (3)
    if (party === 'company') {
      interview.status = 'confirmed';
      await Application.findByIdAndUpdate(interview.applicationId, { status: 3 });
    }

    await interview.save();
    res.json({ message: 'Confirmation enregistrée', interview });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};
