import Application from '../models/JobOfferApplication';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { HttpError }    from '../utils/HttpError';
import { runAutoMatchPipeline } from '../services/autoMatch.service';
import { notifyAdmins }        from './notification.controller';

const USER_POPULATE = {
  path: 'user', select: '-password',
  populate: [
    { path: 'candidateProfile.hardSkills.skill', model: 'Skill' },
    { path: 'candidateProfile.softwares.skill',  model: 'Skill' },
    { path: 'candidateProfile.softSkills.skill', model: 'Skill' },
  ],
};

const JOBOFFER_POPULATE = {
  path: 'jobOffer',
  populate: [
    { path: 'company',              model: 'User', select: 'companyProfile login' },
    { path: 'hardSkills.skill',     model: 'Skill' },
    { path: 'softwareSkills.skill', model: 'Skill' },
    { path: 'jobOfferModel',        model: 'JobOfferModel' },
  ],
};

const buildFilter = (attributeName: string, value: string) => {
  const map: Record<string, Record<string, unknown>> = {
    jobOffer: { jobOffer: value },
    User:     { user: value },
    status:   { status: Number(value) },
  };
  return map[attributeName] || { [attributeName]: value };
};

// GET /api/JobOfferApplication
export const getAll = asyncHandler(async (_req, res) => {
  res.json(
    await Application.find({ deleted: false, archived: { $ne: true } })
      .populate(USER_POPULATE)
      .populate(JOBOFFER_POPULATE),
  );
});

// GET /api/JobOfferApplication/archived
export const getArchived = asyncHandler(async (_req, res) => {
  res.json(
    await Application.find({ deleted: false, archived: true })
      .populate(USER_POPULATE)
      .populate(JOBOFFER_POPULATE)
      .sort({ updatedAt: -1 }),
  );
});

// PATCH /api/JobOfferApplication/:id/archive
export const archive = asyncHandler(async (req, res) => {
  const app = await Application.findByIdAndUpdate(
    req.params['id'], { archived: true }, { new: true },
  );
  if (!app) throw HttpError.notFound('Candidature introuvable');
  res.json(app);
});

// PATCH /api/JobOfferApplication/:id/unarchive
export const unarchive = asyncHandler(async (req, res) => {
  const app = await Application.findByIdAndUpdate(
    req.params['id'], { archived: false }, { new: true },
  );
  if (!app) throw HttpError.notFound('Candidature introuvable');
  res.json(app);
});

// GET /api/JobOfferApplication/count
export const getCount = asyncHandler(async (_req, res) =>
  res.json(await Application.countDocuments({ deleted: false, archived: { $ne: true } })));

// GET /api/JobOfferApplication/byattribute/:attr/:value
export const getByAttribute = asyncHandler(async (req, res) => {
  const { attributeName, value } = req.params;
  const filter = { ...buildFilter(attributeName, value), deleted: false };
  res.json(
    await Application.find(filter)
      .populate(USER_POPULATE)
      .populate(JOBOFFER_POPULATE),
  );
});

// GET /api/JobOfferApplication/ByAttributeCount/:attr/:value
export const getCountByAttribute = asyncHandler(async (req, res) => {
  const { attributeName, value } = req.params;
  const filter = { ...buildFilter(attributeName, value), deleted: false };
  res.json(await Application.countDocuments(filter));
});

// GET /api/JobOfferApplication/:id
export const getById = asyncHandler(async (req, res) => {
  const app = await Application.findById(req.params['id'])
    .populate(USER_POPULATE)
    .populate(JOBOFFER_POPULATE);
  if (!app) throw HttpError.notFound('Candidature non trouvée');
  res.json(app);
});

// POST /api/JobOfferApplication
export const create = asyncHandler<AuthRequest>(async (req, res) => {
  const userId    = req.body.user || req.userId;
  const jobOfferId = req.body.jobOffer;

  // Si une candidature auto-suggérée (status 0) existe, on la promeut à 1.
  const existing = jobOfferId
    ? await Application.findOne({ user: userId, jobOffer: jobOfferId, status: 0, deleted: false })
    : null;

  const app = existing
    ? await Application.findByIdAndUpdate(existing._id,
        { status: 1, cv: req.body.cv, coverLetter: req.body.coverLetter },
        { new: true })
    : await Application.create({ ...req.body, user: userId });

  res.status(201).json(app);
  if (app) {
    setImmediate(() => runAutoMatchPipeline({ applicationId: app._id.toString() }));
    setImmediate(() => notifyAdmins(
      'NEW_APPLICATION',
      'Nouvelle candidature soumise pour une offre',
      { applicationId: app._id.toString(), userId: userId?.toString() },
    ).catch(() => undefined));
  }
});

// PUT /api/JobOfferApplication
export const update = asyncHandler<AuthRequest>(async (req, res) => {
  const { id, ...rest } = req.body;
  res.json(await Application.findByIdAndUpdate(id, rest, { new: true }));
});

// PATCH /api/JobOfferApplication
export const patch = asyncHandler<AuthRequest>(async (req, res) => {
  const { id, ...fields } = req.body;
  res.json(await Application.findByIdAndUpdate(id, fields, { new: true }));
});

// DELETE /api/JobOfferApplication/:id
export const remove = asyncHandler<AuthRequest>(async (req, res) => {
  await Application.findByIdAndUpdate(req.params['id'], { deleted: true });
  res.json({ message: 'Candidature supprimée' });
});

// GET /api/JobOfferApplication/company/:companyId
export const getApplicationsByCompany = asyncHandler(async (req, res) => {
  res.json(
    await Application.find({ 'jobOffer.company': req.params['companyId'], deleted: false })
      .populate(USER_POPULATE)
      .populate({
        path: 'jobOffer',
        populate: [{ path: 'company', model: 'User', select: 'companyProfile login' }],
      })
      .sort({ createdAt: -1 }),
  );
});

// GET /api/JobOfferApplication/interns/:companyId (status = 4)
export const getInternsByCompany = asyncHandler(async (req, res) => {
  res.json(
    await Application.find({
      'jobOffer.company': req.params['companyId'], status: 4, deleted: false,
    })
      .populate('user', 'firstName lastName login avatar -_id')
      .populate('jobOffer', 'title company -_id')
      .sort({ confirmedDate: -1 }),
  );
});

// GET /api/JobOfferApplication/recruited/:companyId (status = 5)
export const getRecruitedByCompany = asyncHandler(async (req, res) => {
  res.json(
    await Application.find({
      'jobOffer.company': req.params['companyId'], status: 5, deleted: false,
    })
      .populate('user', 'firstName lastName login avatar -_id')
      .populate('jobOffer', 'title company -_id')
      .sort({ confirmedDate: -1 }),
  );
});
