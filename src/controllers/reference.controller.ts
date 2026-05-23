import { Request } from 'express';
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
import { asyncHandler } from '../middleware/asyncHandler';
import { HttpError }    from '../utils/HttpError';

const paginate = (req: Request) => ({
  skip:  parseInt(req.query['start'] as string) || 0,
  limit: parseInt(req.query['count'] as string) || 100,
});

/** Factorise les 9 handlers CRUD identiques de chaque référentiel. */
function makeCrud(Model: mongoose.Model<any>) {
  const stripId = (body: any) => {
    const fields: any = { ...body };
    delete fields._id; delete fields.id;
    return fields;
  };
  const requireId = (req: Request): string => {
    const id = req.params['id'] || req.body._id || req.body.id;
    if (!id) throw HttpError.badRequest('id manquant');
    return id;
  };

  return {
    getAll: asyncHandler(async (req, res) => {
      const { skip, limit } = paginate(req);
      res.json(await Model.find().skip(skip).limit(limit));
    }),

    getById: asyncHandler(async (req, res) => {
      const item = await Model.findById(req.params['id']);
      if (!item) throw HttpError.notFound();
      res.json(item);
    }),

    create: asyncHandler(async (req, res) => {
      res.status(201).json(await Model.create(req.body));
    }),

    update: asyncHandler(async (req, res) => {
      const id = req.body._id || req.body.id;
      if (!id) throw HttpError.badRequest('id manquant dans le body');
      const item = await Model.findByIdAndUpdate(id, stripId(req.body), { new: true });
      if (!item) throw HttpError.notFound();
      res.json(item);
    }),

    patch: asyncHandler(async (req, res) => {
      const id = requireId(req);
      const item = await Model.findByIdAndUpdate(id, { $set: stripId(req.body) }, { new: true });
      if (!item) throw HttpError.notFound();
      res.json(item);
    }),

    remove: asyncHandler(async (req, res) => {
      await Model.findByIdAndDelete(req.params['id']);
      res.status(204).send();
    }),

    count: asyncHandler(async (_req, res) => {
      res.json(await Model.countDocuments());
    }),

    getByAttribute: asyncHandler(async (req, res) => {
      const { skip, limit } = paginate(req);
      const { attributeName, value } = req.params;
      res.json(await Model.find({ [attributeName]: value }).skip(skip).limit(limit));
    }),

    countByAttribute: asyncHandler(async (req, res) => {
      const { attributeName, value } = req.params;
      res.json(await Model.countDocuments({ [attributeName]: value }));
    }),
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

// Cross-count helpers
export const countSoftwareSkillHandler = asyncHandler(async (_req, res) =>
  res.json(await SoftwareSkill.countDocuments()));
export const countFocusedSkillHandler  = asyncHandler(async (_req, res) =>
  res.json(await FocusedSkill.countDocuments()));
export const countHardSkillHandler     = asyncHandler(async (_req, res) =>
  res.json(await HardSkill.countDocuments()));

// Legacy named exports (kept for backward compat)
export const getLanguages         = lang.getAll;
export const getCountries         = country.getAll;
export const getHardSkills        = hardSkill.getAll;
export const getSoftwareSkills    = softwareSkill.getAll;
export const getFocusedSkills     = focusedSkill.getAll;
export const getWorkingModes      = workingMode.getAll;
export const getWorkingModeById   = workingMode.getById;
export const getCareers           = career.getAll;
export const getJobOfferModelById = jobOfferModel.getById;

export const getPrograms = asyncHandler(async (_req, res) =>
  res.json(await Program.find()));

export const getQuizzes  = asyncHandler(async (_req, res) =>
  res.json(await Quiz.find({ deleted: { $ne: true } })));
