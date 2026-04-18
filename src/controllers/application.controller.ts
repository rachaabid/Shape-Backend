import { Request, Response } from 'express';
import Application from '../models/JobOfferApplication';
import { AuthRequest } from '../middleware/auth.middleware';

const buildFilter = (attributeName: string, value: string) => {
  const map: Record<string, Record<string, unknown>> = {
    jobOffer: { jobOffer: value },
    User:     { user: value },
    status:   { status: Number(value) },
  };
  return map[attributeName] || { [attributeName]: value };
};

// GET /api/JobOfferApplication
export const getAll = async (_req: Request, res: Response): Promise<void> => {
  try {
    const apps = await Application.find({ deleted: false })
      .populate('user', '-password')
      .populate('jobOffer');
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// GET /api/JobOfferApplication/count
export const getCount = async (_req: Request, res: Response): Promise<void> => {
  try {
    const count = await Application.countDocuments({ deleted: false });
    res.json(count);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// GET /api/JobOfferApplication/byattribute/:attr/:value
export const getByAttribute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { attributeName, value } = req.params;
    const filter = { ...buildFilter(attributeName, value), deleted: false };
    const apps   = await Application.find(filter)
      .populate('user', '-password')
      .populate('jobOffer');
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// GET /api/JobOfferApplication/ByAttributeCount/:attr/:value
export const getCountByAttribute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { attributeName, value } = req.params;
    const filter = { ...buildFilter(attributeName, value), deleted: false };
    const count  = await Application.countDocuments(filter);
    res.json(count);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// GET /api/JobOfferApplication/:id
export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const app = await Application.findById(req.params.id)
      .populate('user', '-password')
      .populate('jobOffer');
    if (!app) { res.status(404).json({ message: 'Candidature non trouvée' }); return; }
    res.json(app);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// POST /api/JobOfferApplication
export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const app = await Application.create({ ...req.body, user: req.body.user || req.userId });
    res.status(201).json(app);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// PUT /api/JobOfferApplication
export const update = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, ...rest } = req.body;
    const app = await Application.findByIdAndUpdate(id, rest, { new: true });
    res.json(app);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// PATCH /api/JobOfferApplication  (update status)
export const patch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, status } = req.body;
    const app = await Application.findByIdAndUpdate(id, { status }, { new: true });
    res.json(app);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// DELETE /api/JobOfferApplication/:id
export const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Application.findByIdAndUpdate(req.params.id, { deleted: true });
    res.json({ message: 'Candidature supprimée' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};
