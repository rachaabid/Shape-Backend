import { Request, Response } from 'express';
import JobOffer from '../models/JobOffer';
import { AuthRequest } from '../middleware/auth.middleware';
import { runAutoMatchPipeline } from '../services/autoMatch.service';

const buildFilter = (attributeName: string, value: string) => {
  const map: Record<string, Record<string, unknown>> = {
    company:     { company: value },
    workingMode: { workingMode: value },
    status:      { status: value },
  };
  return map[attributeName] || { [attributeName]: value };
};

// GET /api/JobOffer
export const getAll = async (_req: Request, res: Response): Promise<void> => {
  try {
    const offers = await JobOffer.find({ deleted: false })
      .populate('company', 'name logo')
      .populate('workingMode', 'name')
      .populate('jobOfferModel', 'name');
    res.json(offers);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// GET /api/JobOffer/count
export const getCount = async (_req: Request, res: Response): Promise<void> => {
  try {
    const count = await JobOffer.countDocuments({ deleted: false });
    res.json(count);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// GET /api/JobOffer/byattribute/company/:companyId
// GET /api/JobOffer/byattribute/:attr/:value
export const getByAttribute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { attributeName, value } = req.params;
    const filter = { ...buildFilter(attributeName, value), deleted: false };
    const offers = await JobOffer.find(filter)
      .populate('company', 'name logo')
      .populate('workingMode', 'name');
    res.json(offers);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// GET /api/JobOffer/ByAttributeCount/:attr/:value
export const getCountByAttribute = async (req: Request, res: Response): Promise<void> => {
  try {
    const { attributeName, value } = req.params;
    const filter = { ...buildFilter(attributeName, value), deleted: false };
    const count  = await JobOffer.countDocuments(filter);
    res.json(count);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// GET /api/JobOffer/EvaluateByUser/:userId
export const getEvaluatedByUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { default: Application } = await import('../models/JobOfferApplication');
    const apps = await Application.find({ user: req.params.userId }).select('jobOffer');
    const ids  = apps.map(a => a.jobOffer);
    const offers = await JobOffer.find({ _id: { $in: ids }, deleted: false });
    res.json(offers);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// GET /api/JobOffer/:id
export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const offer = await JobOffer.findById(req.params.id)
      .populate('company', 'name logo address')
      .populate('workingMode', 'name description')
      .populate('jobOfferModel', 'name');
    if (!offer) { res.status(404).json({ message: 'Offre non trouvée' }); return; }
    res.json(offer);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// POST /api/JobOffer
export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const offer = await JobOffer.create(req.body);
    res.status(201).json(offer);
    // Déclencher le pipeline de matching en arrière-plan
    setImmediate(() => runAutoMatchPipeline({ jobOfferId: offer._id.toString() }));
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// PUT /api/JobOffer
export const update = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, ...rest } = req.body;
    const offer = await JobOffer.findByIdAndUpdate(id, rest, { new: true });
    res.json(offer);
    if (offer) setImmediate(() => runAutoMatchPipeline({ jobOfferId: offer._id.toString() }));
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// PATCH /api/JobOffer
export const patch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, ...rest } = req.body;
    const offer = await JobOffer.findByIdAndUpdate(id, rest, { new: true });
    res.json(offer);
    if (offer) setImmediate(() => runAutoMatchPipeline({ jobOfferId: offer._id.toString() }));
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// DELETE /api/JobOffer/:id
export const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await JobOffer.findByIdAndUpdate(req.params.id, { deleted: true });
    res.json({ message: 'Offre supprimée' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};
