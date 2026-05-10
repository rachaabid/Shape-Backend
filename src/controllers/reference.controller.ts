import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Language      from '../models/Language';
import Country       from '../models/Country';
import Career        from '../models/Career';
import WorkingMode   from '../models/WorkingMode';
import HardSkill     from '../models/HardSkill';
import SoftSkill     from '../models/SoftSkill';
import SoftwareSkill from '../models/SoftwareSkill';
import FocusedSkill  from '../models/FocusedSkill';
import JobOfferModel from '../models/JobOfferModel';
import Program       from '../models/Program';
import Quiz          from '../models/Quiz';

const paginate = (req: Request) => ({
  skip:  parseInt(req.query['start'] as string) || 0,
  limit: parseInt(req.query['count'] as string) || 100,
});

function makeCrud(Model: mongoose.Model<any>) {
  return {
    getAll: async (req: Request, res: Response): Promise<void> => {
      try {
        const { skip, limit } = paginate(req);
        res.json(await Model.find().skip(skip).limit(limit));
      } catch (e) { res.status(500).json({ error: e }); }
    },

    getById: async (req: Request, res: Response): Promise<void> => {
      try {
        const item = await Model.findById(req.params['id']);
        if (!item) { res.status(404).json({ message: 'Non trouvé' }); return; }
        res.json(item);
      } catch (e) { res.status(500).json({ error: e }); }
    },

    create: async (req: Request, res: Response): Promise<void> => {
      try {
        const item = await Model.create(req.body);
        res.status(201).json(item);
      } catch (e) { res.status(500).json({ error: e }); }
    },

    update: async (req: Request, res: Response): Promise<void> => {
      try {
        const id = req.body._id || req.body.id;
        if (!id) { res.status(400).json({ message: 'id manquant dans le body' }); return; }
        const fields: any = { ...req.body };
        delete fields._id;
        delete fields.id;
        const item = await Model.findByIdAndUpdate(id, fields, { new: true });
        if (!item) { res.status(404).json({ message: 'Non trouvé' }); return; }
        res.json(item);
      } catch (e) { res.status(500).json({ error: e }); }
    },

    patch: async (req: Request, res: Response): Promise<void> => {
      try {
        const id = req.params['id'] || req.body._id || req.body.id;
        if (!id) { res.status(400).json({ message: 'id manquant' }); return; }
        const fields: any = { ...req.body };
        delete fields._id;
        delete fields.id;
        const item = await Model.findByIdAndUpdate(id, { $set: fields }, { new: true });
        if (!item) { res.status(404).json({ message: 'Non trouvé' }); return; }
        res.json(item);
      } catch (e) { res.status(500).json({ error: e }); }
    },

    remove: async (req: Request, res: Response): Promise<void> => {
      try {
        await Model.findByIdAndDelete(req.params['id']);
        res.status(204).send();
      } catch (e) { res.status(500).json({ error: e }); }
    },

    count: async (_req: Request, res: Response): Promise<void> => {
      try { res.json(await Model.countDocuments()); } catch (e) { res.status(500).json({ error: e }); }
    },

    getByAttribute: async (req: Request, res: Response): Promise<void> => {
      try {
        const { skip, limit } = paginate(req);
        const { attributeName, value } = req.params;
        res.json(await Model.find({ [attributeName]: value }).skip(skip).limit(limit));
      } catch (e) { res.status(500).json({ error: e }); }
    },

    countByAttribute: async (req: Request, res: Response): Promise<void> => {
      try {
        const { attributeName, value } = req.params;
        res.json(await Model.countDocuments({ [attributeName]: value }));
      } catch (e) { res.status(500).json({ error: e }); }
    },
  };
}

export const lang          = makeCrud(Language);
export const country       = makeCrud(Country);
export const career        = makeCrud(Career);
export const workingMode   = makeCrud(WorkingMode);
export const hardSkill     = makeCrud(HardSkill);
export const softSkill     = makeCrud(SoftSkill);
export const softwareSkill = makeCrud(SoftwareSkill);
export const focusedSkill  = makeCrud(FocusedSkill);
export const jobOfferModel = makeCrud(JobOfferModel);

// Cross-count helpers (used by frontend services)
export const countSoftwareSkillHandler = async (_req: Request, res: Response): Promise<void> => {
  try { res.json(await SoftwareSkill.countDocuments()); } catch (e) { res.status(500).json({ error: e }); }
};
export const countFocusedSkillHandler = async (_req: Request, res: Response): Promise<void> => {
  try { res.json(await FocusedSkill.countDocuments()); } catch (e) { res.status(500).json({ error: e }); }
};
export const countHardSkillHandler = async (_req: Request, res: Response): Promise<void> => {
  try { res.json(await HardSkill.countDocuments()); } catch (e) { res.status(500).json({ error: e }); }
};

// Legacy named exports (kept for backward compat)
export const getLanguages        = lang.getAll;
export const getCountries        = country.getAll;
export const getHardSkills       = hardSkill.getAll;
export const getSoftwareSkills   = softwareSkill.getAll;
export const getFocusedSkills    = focusedSkill.getAll;
export const getWorkingModes     = workingMode.getAll;
export const getWorkingModeById  = workingMode.getById;
export const getCareers          = career.getAll;
export const getJobOfferModelById = jobOfferModel.getById;

export const getPrograms = async (_req: Request, res: Response): Promise<void> => {
  try { res.json(await Program.find()); } catch (e) { res.status(500).json({ error: e }); }
};

export const getQuizzes = async (_req: Request, res: Response): Promise<void> => {
  try { res.json(await Quiz.find({ deleted: { $ne: true } })); } catch (e) { res.status(500).json({ error: e }); }
};
