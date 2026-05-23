import ProgramRequest        from '../models/ProgramRequest';
import Inscription           from '../models/Inscription';
import { AuthRequest }       from '../middleware/auth.middleware';
import { asyncHandler }      from '../middleware/asyncHandler';
import { HttpError }         from '../utils/HttpError';
import { sendProgramApproved, sendProgramRejected } from '../services/email.service';

const PROGRAM_REQUEST_POPULATE = [
  { path: 'user',    select: 'email firstName lastName login' },
  { path: 'program', select: 'title' },
];

/** Extrait nom + titre programme à partir d'un user/program populés. */
function decodeUserProgram(reqDoc: any) {
  const u = reqDoc.user    as any;
  const p = reqDoc.program as any;
  const userName     = u?.firstName?.fr || u?.firstName?.en || u?.login || u?.email || '';
  const programTitle = p?.title?.fr    || p?.title?.en    || p?.title?.ar  || '';
  return { user: u, programTitle, userName };
}

const FRONTEND_URL = () => process.env['FRONTEND_URL'] || 'http://localhost:4200';

export const getAll = asyncHandler(async (_req, res) => {
  res.json(
    await ProgramRequest.find({ deleted: { $ne: true } })
      .populate('user', '-password')
      .populate('program')
      .populate('inscription'),
  );
});

export const getMine = asyncHandler<AuthRequest>(async (req, res) => {
  res.json(
    await ProgramRequest.find({ user: req.userId, deleted: { $ne: true } })
      .populate('program'),
  );
});

export const create = asyncHandler<AuthRequest>(async (req, res) => {
  const { program, inscription } = req.body;

  const existing = await ProgramRequest.findOne({
    user: req.userId, program, inscription,
    status: 'pending', deleted: { $ne: true },
  });
  if (existing) throw HttpError.conflict('Demande déjà en attente pour ce programme.');

  const request = await ProgramRequest.create({ user: req.userId, program, inscription });
  res.status(201).json(request);
});

export const approve = asyncHandler(async (req, res) => {
  const request = await ProgramRequest.findByIdAndUpdate(
    req.params['id'], { status: 'approved' }, { new: true },
  ).populate(PROGRAM_REQUEST_POPULATE);
  if (!request) throw HttpError.notFound('Demande non trouvée.');

  await Inscription.findByIdAndUpdate(
    request.inscription, { $addToSet: { programs: request.program } },
  );
  res.json(request);

  setImmediate(() => {
    const { user, userName, programTitle } = decodeUserProgram(request);
    if (user?.email && programTitle) {
      sendProgramApproved({
        userEmail: user.email, userName, programTitle, frontendUrl: FRONTEND_URL(),
      }).catch(err =>
        console.error(`❌ Échec envoi "programme approuvé" à ${user.email}:`, err?.message || err));
    }
  });
});

export const revoke = asyncHandler(async (req, res) => {
  const request = await ProgramRequest.findByIdAndUpdate(
    req.params['id'], { status: 'pending' }, { new: true },
  ).populate(PROGRAM_REQUEST_POPULATE);
  if (!request) throw HttpError.notFound('Demande non trouvée.');

  await Inscription.findByIdAndUpdate(
    request.inscription, { $pull: { programs: request.program } },
  );
  res.json(request);
});

export const reject = asyncHandler(async (req, res) => {
  const request = await ProgramRequest.findByIdAndUpdate(
    req.params['id'], { status: 'rejected' }, { new: true },
  ).populate(PROGRAM_REQUEST_POPULATE);
  if (!request) throw HttpError.notFound('Demande non trouvée.');
  res.json(request);

  setImmediate(() => {
    const { user, userName, programTitle } = decodeUserProgram(request);
    if (user?.email && programTitle) {
      sendProgramRejected({
        userEmail: user.email, userName, programTitle, frontendUrl: FRONTEND_URL(),
      }).catch(err =>
        console.error(`❌ Échec envoi "programme rejeté" à ${user.email}:`, err?.message || err));
    }
  });
});
