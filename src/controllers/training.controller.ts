import Training    from '../models/Training';
import Inscription from '../models/Inscription';
import TextBloc from '../models/TextBloc';
import VideoYoutube from '../models/VideoYoutube'; // lecture legacy uniquement
import Quiz from '../models/Quiz';
import Video from '../models/Video';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { HttpError }    from '../utils/HttpError';

// VideoYoutube conservé pour résoudre les contenus legacy existants en base.
// Les nouvelles vidéos YouTube utilisent Video avec source='youtube'.
const CONTENT_MODELS: Record<string, any> = { TextBloc, VideoYoutube, Quiz, Video };

export const getTrainings = asyncHandler(async (req, res) => {
  const start = parseInt(req.query['start'] as string) || 0;
  const count = parseInt(req.query['count'] as string) || 100;
  res.json(
    await Training.find({ deleted: { $ne: true }, archived: { $ne: true } })
      .skip(start).limit(count),
  );
});

// GET /api/Training/archived — formations archivees (non supprimees)
export const getArchivedTrainings = asyncHandler(async (_req, res) => {
  res.json(
    await Training.find({ deleted: { $ne: true }, archived: true })
      .sort({ updatedAt: -1 }),
  );
});

// PATCH /api/Training/:id/archive
export const archiveTraining = asyncHandler(async (req, res) => {
  const training = await Training.findByIdAndUpdate(
    req.params['id'], { archived: true }, { new: true },
  );
  if (!training) throw HttpError.notFound('Training introuvable');
  res.json(training);
});

// PATCH /api/Training/:id/unarchive
export const unarchiveTraining = asyncHandler(async (req, res) => {
  const training = await Training.findByIdAndUpdate(
    req.params['id'], { archived: false }, { new: true },
  );
  if (!training) throw HttpError.notFound('Training introuvable');
  res.json(training);
});

// GET /api/Training/mine — programmes créés par le mentor connecté
export const getMyTrainings = asyncHandler<AuthRequest>(async (req, res) => {
  res.json(await Training.find({ owner: req.userId, deleted: { $ne: true } }));
});

// GET /api/Training/by-owner/:ownerId — tous les programmes d'un mentor (backoffice admin)
export const getTrainingsByOwner = asyncHandler(async (req, res) => {
  res.json(
    await Training.find({ owner: req.params['ownerId'], deleted: { $ne: true }, archived: { $ne: true } }),
  );
});

// GET /api/Training/mentor-all — toutes les formations liées au mentor :
// possédées (owner = moi) + référencées via les inscriptions (mentor = moi).
// Même logique que le backoffice user-detail.
export const getMentorAllTrainings = asyncHandler<AuthRequest>(async (req, res) => {
  const userId = req.userId;

  const [allTrainings, inscriptions] = await Promise.all([
    Training.find({ deleted: { $ne: true }, archived: { $ne: true } }),
    Inscription.find({ mentor: userId, deleted: { $ne: true } }),
  ]);

  const ownedIds = new Set<string>();
  const refIds   = new Set<string>();

  // Compte combien d'interns du mentor sont inscrits à chaque formation
  const enrolledCount = new Map<string, number>();

  allTrainings.forEach(t => {
    const owner = t.owner?.toString();
    if (owner === userId) ownedIds.add(t._id.toString());
  });

  inscriptions.forEach((ins: any) => {
    (Array.isArray(ins.trainings) ? ins.trainings : []).forEach((tid: any) => {
      const id = tid?.toString();
      if (id) {
        refIds.add(id);
        enrolledCount.set(id, (enrolledCount.get(id) ?? 0) + 1);
      }
    });
  });

  const seen = new Set<string>();
  const result = allTrainings
    .filter(t => {
      const id = t._id.toString();
      if ((ownedIds.has(id) || refIds.has(id)) && !seen.has(id)) {
        seen.add(id);
        return true;
      }
      return false;
    })
    .map(t => ({
      ...t.toObject(),
      enrolledCount: enrolledCount.get(t._id.toString()) ?? 0,
    }));

  res.json(result);
});

export const getTrainingById = asyncHandler(async (req, res) => {
  const training = await Training.findById(req.params['id']);
  if (!training) throw HttpError.notFound('Training introuvable');

  const trainingObj = training.toObject() as any;
  for (const course of trainingObj.courses || []) {
    for (const item of course.contents || []) {
      const Model = CONTENT_MODELS[item.contentType];
      if (Model) {
        item.contentData = await Model
          .findById(item.content)
          .select('title description url html duration')
          .lean()
          .catch(() => null);
      }
    }
  }
  res.json(trainingObj);
});

export const countTrainings = asyncHandler(async (_req, res) => {
  res.json({ count: await Training.countDocuments({ deleted: { $ne: true }, archived: { $ne: true } }) });
});

export const createTraining = asyncHandler<AuthRequest>(async (req, res) => {
  const training = await Training.create({ ...req.body, owner: req.userId });
  res.status(201).json(training);
});

export const updateTraining = asyncHandler(async (req, res) => {
  const { id, ...data } = req.body;
  const training = await Training.findByIdAndUpdate(id, data, { new: true });
  if (!training) throw HttpError.notFound('Training introuvable');
  res.json(training);
});

export const deleteTraining = asyncHandler(async (req, res) => {
  await Training.findByIdAndUpdate(req.params['id'], { deleted: true });
  res.json({ message: 'Training supprimé' });
});
