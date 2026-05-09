import { Request, Response } from 'express';
import Application from '../models/JobOfferApplication';
import { AuthRequest } from '../middleware/auth.middleware';
import { runAutoMatchPipeline } from '../services/autoMatch.service';
import { notifyAdmins }        from './notification.controller';

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
    const userId    = req.body.user || req.userId;
    const jobOfferId = req.body.jobOffer;

    // If an auto-suggested application (status 0) exists, upgrade it to status 1
    const existing = jobOfferId
      ? await Application.findOne({ user: userId, jobOffer: jobOfferId, status: 0, deleted: false })
      : null;

    let app: any;
    if (existing) {
      app = await Application.findByIdAndUpdate(
        existing._id,
        { status: 1, cv: req.body.cv, coverLetter: req.body.coverLetter },
        { new: true }
      );
    } else {
      app = await Application.create({ ...req.body, user: userId });
    }

    res.status(201).json(app);
    setImmediate(() => runAutoMatchPipeline({ applicationId: app._id.toString() }));
    setImmediate(() => notifyAdmins(
      'NEW_APPLICATION',
      `Nouvelle candidature soumise pour une offre`,
      { applicationId: app._id.toString(), userId: userId?.toString() }
    ).catch(() => {}));
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

// GET /api/JobOfferApplication/company/:companyId - Toutes candidatures pour une entreprise
export const getApplicationsByCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId } = req.params;
    const apps = await Application.find({ 
      'jobOffer.company': companyId, 
      deleted: false 
    })
      .populate({
        path: 'user', select: '-password',
        populate: [{ path: 'hardSkills.skill', model: 'HardSkill' }, { path: 'softwares.skill', model: 'SoftwareSkill' }]
      })
      .populate({
        path: 'jobOffer',
        populate: [{ path: 'company', model: 'Company', select: 'name logo' }]
      })
      .sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// GET /api/JobOfferApplication/interns/:companyId - Interns (status = 4)
export const getInternsByCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId } = req.params;
    const apps = await Application.find({ 
      'jobOffer.company': companyId, 
      status: 4,
      deleted: false 
    })
      .populate('user', 'firstName lastName login avatar -_id')
      .populate('jobOffer', 'title company -_id')
      .sort({ confirmedDate: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// GET /api/JobOfferApplication/recruited/:companyId - Recruited (status = 5)
export const getRecruitedByCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId } = req.params;
    const apps = await Application.find({ 
      'jobOffer.company': companyId, 
      status: 5,
      deleted: false 
    })
      .populate('user', 'firstName lastName login avatar -_id')
      .populate('jobOffer', 'title company -_id')
      .sort({ confirmedDate: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

