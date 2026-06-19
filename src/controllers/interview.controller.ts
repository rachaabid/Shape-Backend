import crypto from 'crypto';
import Interview from '../models/Interview';
import MentorAppointment from '../models/MentorAppointment';
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
// Note: les entretiens "completed"/"cancelled" sont considérés comme archivés
// et ne sortent pas du listing principal. Voir /archived pour les récupérer.
// Les MentorAppointments avec un stagiaire assigné sont également inclus.
export const getInterviews = asyncHandler(async (_req, res) => {
  const [interviews, mentorAppts] = await Promise.all([
    Interview.find({ status: { $nin: ['completed', 'cancelled'] } })
      .populate('candidateId', '-password')
      .populate('companyId', 'companyProfile login email')
      .populate('jobOfferId')
      .sort({ scheduledAt: 1 }),
    MentorAppointment.find({ deleted: { $ne: true }, intern: { $exists: true, $ne: null } })
      .populate('intern', 'firstName lastName login email')
      .populate('mentor', 'firstName lastName login email mentorProfile')
      .sort({ date: 1, startTime: 1 }),
  ]);

  const mappedMentorAppts = mentorAppts.map((a: any) => ({
    _id:          a._id,
    candidateId:  a.intern,
    companyId:    a.mentor,
    jobOfferId:   null,
    scheduledAt:  new Date(`${a.date}T${a.startTime}:00`),
    channelName:  a.meetingLink || '',
    status:       'scheduled',
    notes:        a.subtitle || '',
    isMentorMeeting: true,
    title:        a.title,
  }));

  const all = [...(interviews as any[]), ...mappedMentorAppts]
    .sort((x, y) => new Date(x.scheduledAt).getTime() - new Date(y.scheduledAt).getTime());

  res.json(all);
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
