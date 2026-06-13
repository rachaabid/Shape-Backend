import TrainingRequest        from '../models/TrainingRequest';
import Inscription           from '../models/Inscription';
import { AuthRequest }       from '../middleware/auth.middleware';
import { asyncHandler }      from '../middleware/asyncHandler';
import { HttpError }         from '../utils/HttpError';
import { sendTrainingApproved, sendTrainingRejected, sendTrainingArchived } from '../services/email.service';

const TRAINING_REQUEST_POPULATE = [
  { path: 'user',    select: 'email firstName lastName login' },
  { path: 'training', select: 'title' },
];

/** Extrait nom + titre programme à partir d'un user/training populés. */
function decodeUserTraining(reqDoc: any) {
  const u = reqDoc.user    as any;
  const p = reqDoc.training as any;
  const userName     = u?.firstName?.fr || u?.firstName?.en || u?.login || u?.email || '';
  const trainingTitle = p?.title?.fr    || p?.title?.en    || p?.title?.ar  || '';
  return { user: u, trainingTitle, userName };
}

const FRONTEND_URL = () => process.env['FRONTEND_URL'] || 'http://localhost:4200';

// Liste « active » : ce que l'admin voit dans la file de validation.
// On exclut les demandes archivees pour qu'elles ne polluent pas la vue.
export const getAll = asyncHandler(async (_req, res) => {
  res.json(
    await TrainingRequest.find({ deleted: { $ne: true }, archived: { $ne: true } })
      .populate('user', '-password')
      .populate('training')
      .populate('inscription')
      .sort({ createdAt: -1 }),
  );
});

// Vue dediee aux demandes archivees (pour l'historique).
export const getArchived = asyncHandler(async (_req, res) => {
  res.json(
    await TrainingRequest.find({ deleted: { $ne: true }, archived: true })
      .populate('user', '-password')
      .populate('training')
      .populate('inscription')
      .sort({ updatedAt: -1 }),
  );
});

export const getMine = asyncHandler<AuthRequest>(async (req, res) => {
  res.json(
    await TrainingRequest.find({ user: req.userId, deleted: { $ne: true } })
      .populate('training'),
  );
});

export const create = asyncHandler<AuthRequest>(async (req, res) => {
  const { training, inscription } = req.body;

  const existing = await TrainingRequest.findOne({
    user: req.userId, training, inscription,
    status: 'pending', deleted: { $ne: true },
  });
  if (existing) throw HttpError.conflict('Demande déjà en attente pour ce programme.');

  const request = await TrainingRequest.create({ user: req.userId, training, inscription });
  res.status(201).json(request);
});

export const approve = asyncHandler(async (req, res) => {
  const request = await TrainingRequest.findByIdAndUpdate(
    req.params['id'], { status: 'approved' }, { new: true },
  ).populate(TRAINING_REQUEST_POPULATE);
  if (!request) throw HttpError.notFound('Demande non trouvée.');

  await Inscription.findByIdAndUpdate(
    request.inscription, { $addToSet: { trainings: request.training } },
  );
  res.json(request);

  setImmediate(() => {
    const { user, userName, trainingTitle } = decodeUserTraining(request);
    if (user?.email && trainingTitle) {
      sendTrainingApproved({
        userEmail: user.email, userName, trainingTitle, frontendUrl: FRONTEND_URL(),
      }).catch(err =>
        console.error(`❌ Échec envoi "programme approuvé" à ${user.email}:`, err?.message || err));
    }
  });
});

export const revoke = asyncHandler(async (req, res) => {
  const request = await TrainingRequest.findByIdAndUpdate(
    req.params['id'], { status: 'pending' }, { new: true },
  ).populate(TRAINING_REQUEST_POPULATE);
  if (!request) throw HttpError.notFound('Demande non trouvée.');

  await Inscription.findByIdAndUpdate(
    request.inscription, { $pull: { trainings: request.training } },
  );
  res.json(request);
});

export const reject = asyncHandler(async (req, res) => {
  const request = await TrainingRequest.findByIdAndUpdate(
    req.params['id'], { status: 'rejected' }, { new: true },
  ).populate(TRAINING_REQUEST_POPULATE);
  if (!request) throw HttpError.notFound('Demande non trouvée.');

  // Remove training from inscription in case it was previously approved
  await Inscription.findByIdAndUpdate(
    request.inscription, { $pull: { trainings: request.training } },
  );
  res.json(request);

  setImmediate(() => {
    const { user, userName, trainingTitle } = decodeUserTraining(request);
    if (user?.email && trainingTitle) {
      sendTrainingRejected({
        userEmail: user.email, userName, trainingTitle, frontendUrl: FRONTEND_URL(),
      }).catch(err =>
        console.error(`❌ Échec envoi "programme rejeté" à ${user.email}:`, err?.message || err));
    }
  });
});

// PATCH /api/TrainingRequest/:id/archive — sort la demande de la file et
// previent le candidat par email.
export const archive = asyncHandler(async (req, res) => {
  const request = await TrainingRequest.findByIdAndUpdate(
    req.params['id'], { archived: true }, { new: true },
  ).populate(TRAINING_REQUEST_POPULATE);
  if (!request) throw HttpError.notFound('Demande non trouvée.');

  res.json(request);

  setImmediate(() => {
    const { user, userName, trainingTitle } = decodeUserTraining(request);
    if (user?.email && trainingTitle) {
      sendTrainingArchived({
        userEmail: user.email, userName, trainingTitle, frontendUrl: FRONTEND_URL(),
      }).catch(err =>
        console.error(`❌ Échec envoi "programme archivé" à ${user.email}:`, err?.message || err));
    }
  });
});

// PATCH /api/TrainingRequest/:id/unarchive — remet la demande dans la file.
export const unarchive = asyncHandler(async (req, res) => {
  const request = await TrainingRequest.findByIdAndUpdate(
    req.params['id'], { archived: false }, { new: true },
  ).populate(TRAINING_REQUEST_POPULATE);
  if (!request) throw HttpError.notFound('Demande non trouvée.');
  res.json(request);
});
