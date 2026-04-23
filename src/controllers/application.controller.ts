import { Request, Response } from 'express';
import Application from '../models/JobOfferApplication';
import { AuthRequest } from '../middleware/auth.middleware';
import { runAutoMatchPipeline } from '../services/autoMatch.service';

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
      .populate({
        path: 'user', select: '-password',
        populate: [
          { path: 'hardSkills.skill', model: 'HardSkill' },
          { path: 'softwares.skill',  model: 'SoftwareSkill' },
        ]
      })
      .populate({
        path: 'jobOffer',
        populate: [
          { path: 'company',              model: 'Company', select: 'name logo' },
          { path: 'hardSkills.skill',     model: 'HardSkill' },
          { path: 'softwareSkills.skill', model: 'SoftwareSkill' },
          { path: 'jobOfferModel',        model: 'JobOfferModel' },
          { path: 'workingMode',          model: 'WorkingMode' },
        ]
      });
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
      .populate({
        path: 'user', select: '-password',
        populate: [
          { path: 'hardSkills.skill', model: 'HardSkill' },
          { path: 'softwares.skill',  model: 'SoftwareSkill' },
        ]
      })
      .populate({
        path: 'jobOffer',
        populate: [
          { path: 'company',              model: 'Company', select: 'name logo' },
          { path: 'hardSkills.skill',     model: 'HardSkill' },
          { path: 'softwareSkills.skill', model: 'SoftwareSkill' },
          { path: 'jobOfferModel',        model: 'JobOfferModel' },
          { path: 'workingMode',          model: 'WorkingMode' },
        ]
      });
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
      .populate({
        path: 'user', select: '-password',
        populate: [
          { path: 'hardSkills.skill', model: 'HardSkill' },
          { path: 'softwares.skill',  model: 'SoftwareSkill' },
        ]
      })
      .populate({
        path: 'jobOffer',
        populate: [
          { path: 'company',              model: 'Company', select: 'name logo' },
          { path: 'hardSkills.skill',     model: 'HardSkill' },
          { path: 'softwareSkills.skill', model: 'SoftwareSkill' },
          { path: 'jobOfferModel',        model: 'JobOfferModel' },
          { path: 'workingMode',          model: 'WorkingMode' },
        ]
      });
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
    // Trigger AI matching for this new application in the background
    setImmediate(() => runAutoMatchPipeline({ applicationId: app._id.toString() }));
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

// PATCH /api/JobOfferApplication
export const patch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, ...fields } = req.body;
    const app = await Application.findByIdAndUpdate(id, fields, { new: true });
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
