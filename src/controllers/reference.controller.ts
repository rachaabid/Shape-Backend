import { Request, Response } from 'express';
import Language      from '../models/Language';
import Country       from '../models/Country';
import HardSkill     from '../models/HardSkill';
import SoftwareSkill from '../models/SoftwareSkill';
import FocusedSkill  from '../models/FocusedSkill';
import Program       from '../models/Program';
import WorkingMode   from '../models/WorkingMode';
import JobOfferModel from '../models/JobOfferModel';
import Career        from '../models/Career';
import Quiz          from '../models/Quiz';

const paginate = (req: Request) => {
  const start = parseInt(req.query['start'] as string) || 0;
  const count = parseInt(req.query['count'] as string) || 100;
  return { skip: start, limit: count };
};

export const getLanguages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { skip, limit } = paginate(req);
    const items = await Language.find().skip(skip).limit(limit);
    res.json(items);
  } catch (err) { res.status(500).json({ error: err }); }
};

export const getCountries = async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await Country.find();
    res.json(items);
  } catch (err) { res.status(500).json({ error: err }); }
};

export const getHardSkills = async (req: Request, res: Response): Promise<void> => {
  try {
    const { skip, limit } = paginate(req);
    const items = await HardSkill.find().skip(skip).limit(limit);
    res.json(items);
  } catch (err) { res.status(500).json({ error: err }); }
};

export const getSoftwareSkills = async (req: Request, res: Response): Promise<void> => {
  try {
    const { skip, limit } = paginate(req);
    const items = await SoftwareSkill.find().skip(skip).limit(limit);
    res.json(items);
  } catch (err) { res.status(500).json({ error: err }); }
};

export const getFocusedSkills = async (req: Request, res: Response): Promise<void> => {
  try {
    const { skip, limit } = paginate(req);
    const items = await FocusedSkill.find().skip(skip).limit(limit);
    res.json(items);
  } catch (err) { res.status(500).json({ error: err }); }
};

export const getPrograms = async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await Program.find();
    res.json(items);
  } catch (err) { res.status(500).json({ error: err }); }
};

export const getWorkingModeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await WorkingMode.findById(req.params.id);
    if (!item) { res.status(404).json({ message: 'Non trouvé' }); return; }
    res.json(item);
  } catch (err) { res.status(500).json({ error: err }); }
};

export const getWorkingModes = async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await WorkingMode.find();
    res.json(items);
  } catch (err) { res.status(500).json({ error: err }); }
};

export const getJobOfferModelById = async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await JobOfferModel.findById(req.params.id);
    if (!item) { res.status(404).json({ message: 'Non trouvé' }); return; }
    res.json(item);
  } catch (err) { res.status(500).json({ error: err }); }
};

export const getCareers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await Career.find();
    res.json(items);
  } catch (err) { res.status(500).json({ error: err }); }
};

export const getQuizzes = async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await Quiz.find({ deleted: { $ne: true } });
    res.json(items);
  } catch (err) { res.status(500).json({ error: err }); }
};
