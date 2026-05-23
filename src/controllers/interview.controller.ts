import crypto from 'crypto';
import Interview from '../models/Interview';
import Application from '../models/JobOfferApplication';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { HttpError }    from '../utils/HttpError';
import { notifyAdmins } from './notification.controller';

// GET /api/Interview/bycandidate/:candidateId
export const getByCandidate = asyncHandler(async (req, res) => {
  res.json(
    await Interview.find({ candidateId: req.params['candidateId'] })
      .populate('jobOfferId')
      .sort({ scheduledAt: 1 }),
  );
});

// GET /api/Interview/bycompany/:companyId
export const getByCompany = asyncHandler(async (req, res) => {
  res.json(
    await Interview.find({ companyId: req.params['companyId'] })
      .populate('candidateId', '-password')
      .populate('jobOfferId')
      .sort({ scheduledAt: 1 }),
  );
});

// GET /api/Interview/:id
export const getById = asyncHandler(async (req, res) => {
  const interview = await Interview.findById(req.params['id'])
    .populate('candidateId', '-password')
    .populate('jobOfferId');
  if (!interview) throw HttpError.notFound('Entretien non trouvé');
  res.json(interview);
});

// POST /api/Interview
export const create = asyncHandler<AuthRequest>(async (req, res) => {
  const confirmToken = crypto.randomBytes(32).toString('hex');
  const interview = await Interview.create({ ...req.body, confirmToken });
  res.status(201).json(interview);
  setImmediate(() => notifyAdmins(
    'NEW_INTERVIEW',
    `Entretien planifié le ${new Date(interview.scheduledAt).toLocaleDateString('fr-FR')}`,
    { interviewId: interview._id.toString() },
  ).catch(() => undefined));
});

// PATCH /api/Interview
export const patch = asyncHandler<AuthRequest>(async (req, res) => {
  const { id, ...rest } = req.body;
  res.json(await Interview.findByIdAndUpdate(id, rest, { new: true }));
});

// GET /api/Interview/confirm — appel public depuis l'email de confirmation
export const confirm = asyncHandler(async (req, res) => {
  const { token, party } = req.query as { token: string; party: string };
  if (!token || !['candidate', 'company'].includes(party)) {
    throw HttpError.badRequest('Paramètres invalides');
  }

  const interview = await Interview.findOne({ confirmToken: token });
  if (!interview) throw HttpError.notFound('Entretien non trouvé');

  if (party === 'candidate') interview.confirmedByCandidate = true;
  if (party === 'company') {
    interview.confirmedByCompany = true;
    interview.status = 'confirmed';
    await Application.findByIdAndUpdate(interview.applicationId, { status: 3 });
  }
  await interview.save();
  res.json({ message: 'Confirmation enregistrée', interview });
});

// GET /api/Interview
export const getInterviews = asyncHandler(async (_req, res) => {
  res.json(
    await Interview.find({})
      .populate('candidateId', '-password')
      .populate('companyId', 'name logo')
      .populate('jobOfferId')
      .sort({ scheduledAt: 1 }),
  );
});

// PUT /api/Interview
export const updateInterview = asyncHandler<AuthRequest>(async (req, res) => {
  const { id, ...rest } = req.body;
  res.json(
    await Interview.findByIdAndUpdate(id, rest, { new: true })
      .populate('candidateId', '-password')
      .populate('companyId', 'name logo')
      .populate('jobOfferId'),
  );
});
