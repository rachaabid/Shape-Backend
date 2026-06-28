import { Request } from 'express';
import mongoose from 'mongoose';
import Career        from '../models/Career';
import Skill, { SkillType } from '../models/Skill';
import JobOfferModel from '../models/JobOfferModel';
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
      res.json(await Model.find({ archived: { $ne: true } }).skip(skip).limit(limit));
    }),

    getArchived: asyncHandler(async (_req, res) => {
      res.json(await Model.find({ archived: true }).sort({ updatedAt: -1 }));
    }),

    archive: asyncHandler(async (req, res) => {
      const item = await Model.findByIdAndUpdate(req.params['id'], { archived: true }, { new: true });
      if (!item) throw HttpError.notFound();
      res.json(item);
    }),

    unarchive: asyncHandler(async (req, res) => {
      const item = await Model.findByIdAndUpdate(req.params['id'], { archived: false }, { new: true });
      if (!item) throw HttpError.notFound();
      res.json(item);
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

/** Variante CRUD pour le modèle Skill unifié : toutes les opérations sont
 *  cantonnées à un `type` (HARD/SOFTWARE/FOCUSED/SOFT) et le type est injecté
 *  à la création. Les anciens endpoints (/HardSkill, /SoftwareSkill, …) restent
 *  donc identiques côté contrat d'API. */
function makeSkillCrud(type: SkillType) {
  const withType = (filter: any = {}) => ({ ...filter, type });
  const clean = (body: any) => { const f: any = { ...body, type }; delete f._id; delete f.id; return f; };
  const reqId = (req: Request) => req.params['id'] || req.body._id || req.body.id;

  return {
    getAll: asyncHandler(async (req, res) => {
      const { skip, limit } = paginate(req);
      res.json(await Skill.find(withType({ archived: { $ne: true } })).skip(skip).limit(limit));
    }),
    getArchived: asyncHandler(async (_req, res) =>
      res.json(await Skill.find(withType({ archived: true })).sort({ updatedAt: -1 }))),
    archive: asyncHandler(async (req, res) => {
      const item = await Skill.findOneAndUpdate(withType({ _id: req.params['id'] }), { archived: true }, { new: true });
      if (!item) throw HttpError.notFound(); res.json(item);
    }),
    unarchive: asyncHandler(async (req, res) => {
      const item = await Skill.findOneAndUpdate(withType({ _id: req.params['id'] }), { archived: false }, { new: true });
      if (!item) throw HttpError.notFound(); res.json(item);
    }),
    getById: asyncHandler(async (req, res) => {
      const item = await Skill.findOne(withType({ _id: req.params['id'] }));
      if (!item) throw HttpError.notFound(); res.json(item);
    }),
    create: asyncHandler(async (req, res) => res.status(201).json(await Skill.create(clean(req.body)))),
    update: asyncHandler(async (req, res) => {
      const id = reqId(req);
      if (!id) throw HttpError.badRequest('id manquant dans le body');
      const item = await Skill.findOneAndUpdate(withType({ _id: id }), clean(req.body), { new: true });
      if (!item) throw HttpError.notFound(); res.json(item);
    }),
    patch: asyncHandler(async (req, res) => {
      const id = reqId(req);
      if (!id) throw HttpError.badRequest('id manquant');
      const item = await Skill.findOneAndUpdate(withType({ _id: id }), { $set: clean(req.body) }, { new: true });
      if (!item) throw HttpError.notFound(); res.json(item);
    }),
    remove: asyncHandler(async (req, res) => {
      await Skill.findOneAndDelete(withType({ _id: req.params['id'] })); res.status(204).send();
    }),
    count: asyncHandler(async (_req, res) => res.json(await Skill.countDocuments(withType()))),
    getByAttribute: asyncHandler(async (req, res) => {
      const { skip, limit } = paginate(req);
      const { attributeName, value } = req.params;
      res.json(await Skill.find(withType({ [attributeName]: value })).skip(skip).limit(limit));
    }),
    countByAttribute: asyncHandler(async (req, res) => {
      const { attributeName, value } = req.params;
      res.json(await Skill.countDocuments(withType({ [attributeName]: value })));
    }),
  };
}

export const career        = makeCrud(Career);
export const hardSkill     = makeSkillCrud('HARD');
export const softSkill     = makeSkillCrud('SOFT');
export const softwareSkill = makeSkillCrud('SOFTWARE');
export const focusedSkill  = makeSkillCrud('FOCUSED');
export const jobOfferModel = makeCrud(JobOfferModel);

// Cross-count helpers
export const countSoftwareSkillHandler = asyncHandler(async (_req, res) =>
  res.json(await Skill.countDocuments({ type: 'SOFTWARE' })));
export const countFocusedSkillHandler  = asyncHandler(async (_req, res) =>
  res.json(await Skill.countDocuments({ type: 'FOCUSED' })));
export const countHardSkillHandler     = asyncHandler(async (_req, res) =>
  res.json(await Skill.countDocuments({ type: 'HARD' })));

