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

// GET /api/Interview/bymentor/:mentorId — sessions de mentoring (US33)
export const getByMentor = asyncHandler(async (req, res) => {
  res.json(
    await Interview.find({ kind: 'mentoring', mentorId: req.params['mentorId'] })
      .populate('candidateId', '-password')
      .populate('inscriptionId')
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
  if (!token || !['candidate', 'company', 'mentor'].includes(party)) {
    throw HttpError.badRequest('Paramètres invalides');
  }

  const interview = await Interview.findOne({ confirmToken: token });
  if (!interview) throw HttpError.notFound('Entretien non trouvé');

  if (party === 'candidate') interview.confirmedByCandidate = true;
  if (party === 'company') {
    interview.confirmedByCompany = true;
    interview.status = 'confirmed';
    if (interview.applicationId) {
      await Application.findByIdAndUpdate(interview.applicationId, { status: 3 });
    }
  }
  if (party === 'mentor') {
    interview.confirmedByMentor = true;
    interview.status = 'confirmed';
  }
  await interview.save();
  res.json({ message: 'Confirmation enregistrée', interview });
});

// GET /api/Interview
// Liste les événements actifs (recruitment + mentoring + appointment avec
// stagiaire assigné). Les "completed"/"cancelled" sont archivés — voir /archived.
export const getInterviews = asyncHandler(async (_req, res) => {
  const docs = await Interview.find({
    status: { $nin: ['completed', 'cancelled'] },
    deleted: { $ne: true },
    // Les appointments sans stagiaire (créneaux libres du mentor) ne sortent
    // pas dans la vue globale : ils restent visibles via /Mentor/appointments.
    $or: [
      { kind: { $in: ['recruitment', 'mentoring'] } },
      { kind: 'appointment', candidateId: { $exists: true, $ne: null } },
    ],
  })
    .populate('candidateId', '-password')
    .populate('companyId',   'companyProfile login email')
    .populate('mentorId',    'firstName lastName login email mentorProfile')
    .populate('jobOfferId')
    .sort({ scheduledAt: 1 });

  // Ajoute un flag isMentorMeeting pour les vues UI qui distinguent les RDV
  // informels du mentor des entretiens formels.
  const enriched = docs.map((d: any) => {
    const o = d.toObject();
    return { ...o, isMentorMeeting: o.kind === 'appointment' };
  });
  res.json(enriched);
});

// GET /api/Interview/archived
export const getArchivedInterviews = asyncHandler(async (_req, res) => {
  res.json(
    await Interview.find({ status: { $in: ['completed', 'cancelled'] } })
      .populate('candidateId', '-password')
      .populate('companyId', 'companyProfile login email')
      .populate('jobOfferId')
      .sort({ scheduledAt: -1 }),
  );
});

// PATCH /api/Interview/:id/restore — re-bascule sur 'scheduled'
export const restoreInterview = asyncHandler(async (req, res) => {
  const interview = await Interview.findByIdAndUpdate(
    req.params['id'], { status: 'scheduled' }, { new: true },
  );
  if (!interview) throw HttpError.notFound('Entretien introuvable');
  res.json(interview);
});

// DELETE /api/Interview/:id
export const removeInterview = asyncHandler(async (req, res) => {
  await Interview.findByIdAndDelete(req.params['id']);
  res.json({ message: 'Entretien supprimé' });
});

// PUT /api/Interview
export const updateInterview = asyncHandler<AuthRequest>(async (req, res) => {
  const { id, ...rest } = req.body;
  res.json(
    await Interview.findByIdAndUpdate(id, rest, { new: true })
      .populate('candidateId', '-password')
      .populate('companyId', 'companyProfile login email')
      .populate('jobOfferId'),
  );
});
