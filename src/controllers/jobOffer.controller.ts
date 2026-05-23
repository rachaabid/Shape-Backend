import JobOffer from '../models/JobOffer';
import Application from '../models/JobOfferApplication';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { HttpError }    from '../utils/HttpError';
import { runAutoMatchPipeline } from '../services/autoMatch.service';
import { notifyAdmins } from './notification.controller';

const OFFER_POPULATE = [
  { path: 'company',              select: 'name logo' },
  { path: 'workingMode',          select: 'name' },
  { path: 'jobOfferModel',        select: 'name' },
  { path: 'hardSkills.skill',     select: 'name' },
  { path: 'softwareSkills.skill', select: 'name' },
];

const OFFER_POPULATE_DETAILED = [
  { path: 'company',              select: 'name logo address' },
  { path: 'workingMode',          select: 'name description' },
  { path: 'jobOfferModel',        select: 'name' },
  { path: 'hardSkills.skill',     select: 'name' },
  { path: 'softwareSkills.skill', select: 'name' },
];

const buildFilter = (attributeName: string, value: string) => {
  const map: Record<string, Record<string, unknown>> = {
    company:     { company: value },
    workingMode: { workingMode: value },
    status:      { status: value },
  };
  return map[attributeName] || { [attributeName]: value };
};

// GET /api/JobOffer
export const getAll = asyncHandler(async (_req, res) => {
  res.json(
    await JobOffer.find({ deleted: { $ne: true } }).populate(OFFER_POPULATE),
  );
});

// GET /api/JobOffer/count
export const getCount = asyncHandler(async (_req, res) =>
  res.json(await JobOffer.countDocuments({ deleted: { $ne: true } })));

// GET /api/JobOffer/byattribute/:attr/:value
export const getByAttribute = asyncHandler(async (req, res) => {
  const { attributeName, value } = req.params;
  const filter = { ...buildFilter(attributeName, value), deleted: { $ne: true } };
  res.json(await JobOffer.find(filter).populate(OFFER_POPULATE));
});

// GET /api/JobOffer/ByAttributeCount/:attr/:value
export const getCountByAttribute = asyncHandler(async (req, res) => {
  const { attributeName, value } = req.params;
  const filter = { ...buildFilter(attributeName, value), deleted: { $ne: true } };
  res.json(await JobOffer.countDocuments(filter));
});

// GET /api/JobOffer/EvaluateByUser/:userId
export const getEvaluatedByUser = asyncHandler(async (req, res) => {
  const apps = await Application.find({ user: req.params['userId'] }).select('jobOffer');
  const ids  = apps.map(a => a.jobOffer);
  res.json(await JobOffer.find({ _id: { $in: ids }, deleted: false }));
});

// GET /api/JobOffer/:id
export const getById = asyncHandler(async (req, res) => {
  const offer = await JobOffer.findById(req.params['id']).populate(OFFER_POPULATE_DETAILED);
  if (!offer) throw HttpError.notFound('Offre non trouvée');
  res.json(offer);
});

// POST /api/JobOffer
export const create = asyncHandler<AuthRequest>(async (req, res) => {
  const offer = await JobOffer.create(req.body);
  res.status(201).json(offer);
  setImmediate(() => runAutoMatchPipeline({ jobOfferId: offer._id.toString() }));
  setImmediate(() => notifyAdmins(
    'NEW_JOB_OFFER',
    `Nouvelle offre d'emploi publiée : "${offer.title || 'Sans titre'}"`,
    { offerId: offer._id.toString() },
  ).catch(() => undefined));
});

// PUT /api/JobOffer
export const update = asyncHandler<AuthRequest>(async (req, res) => {
  const { id, ...rest } = req.body;
  const offer = await JobOffer.findByIdAndUpdate(id, rest, { new: true });
  res.json(offer);
  if (offer) setImmediate(() => runAutoMatchPipeline({ jobOfferId: offer._id.toString() }));
});

// PATCH /api/JobOffer
export const patch = asyncHandler<AuthRequest>(async (req, res) => {
  const { id, ...rest } = req.body;
  const offer = await JobOffer.findByIdAndUpdate(id, rest, { new: true });
  res.json(offer);
  if (offer) setImmediate(() => runAutoMatchPipeline({ jobOfferId: offer._id.toString() }));
});

// DELETE /api/JobOffer/:id
export const remove = asyncHandler<AuthRequest>(async (req, res) => {
  await JobOffer.findByIdAndUpdate(req.params['id'], { deleted: true });
  res.json({ message: 'Offre supprimée' });
});

// POST /api/JobOffer/triggerMatchForCompany/:companyId
export const triggerMatchForCompany = asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  const openOffers = await JobOffer.find({
    company: companyId, status: 'open', deleted: { $ne: true },
  }).select('_id');

  const offersToRun: string[] = [];
  for (const offer of openOffers) {
    const hasScored = await Application.exists({
      jobOffer:   offer._id, deleted: false, matchScore: { $gt: 0 },
    });
    if (!hasScored) offersToRun.push(offer._id.toString());
  }
  for (const offerId of offersToRun) {
    setImmediate(() => runAutoMatchPipeline({ jobOfferId: offerId }));
  }
  res.json({ triggered: offersToRun.length });
});

// GET /api/JobOffer/company/:companyId
export const getJobOffersByCompany = asyncHandler(async (req, res) => {
  res.json(
    await JobOffer.find({ company: req.params['companyId'], deleted: { $ne: true } })
      .populate(OFFER_POPULATE)
      .sort({ createdAt: -1 }),
  );
});
