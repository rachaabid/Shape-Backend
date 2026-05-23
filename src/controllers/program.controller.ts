import Program from '../models/Program';
import TextBloc from '../models/TextBloc';
import VideoYoutube from '../models/VideoYoutube';
import Quiz from '../models/Quiz';
import Video from '../models/Video';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { HttpError }    from '../utils/HttpError';

const CONTENT_MODELS: Record<string, any> = { TextBloc, VideoYoutube, Quiz, Video };

export const getPrograms = asyncHandler(async (req, res) => {
  const start = parseInt(req.query['start'] as string) || 0;
  const count = parseInt(req.query['count'] as string) || 100;
  res.json(
    await Program.find({ deleted: { $ne: true } }).skip(start).limit(count),
  );
});

// GET /api/Program/mine — programmes créés par le mentor connecté
export const getMyPrograms = asyncHandler<AuthRequest>(async (req, res) => {
  res.json(await Program.find({ owner: req.userId, deleted: { $ne: true } }));
});

export const getProgramById = asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params['id']);
  if (!program) throw HttpError.notFound('Program introuvable');

  const programObj = program.toObject() as any;
  for (const course of programObj.courses || []) {
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
  res.json(programObj);
});

export const countPrograms = asyncHandler(async (_req, res) => {
  res.json({ count: await Program.countDocuments({ deleted: { $ne: true } }) });
});

export const createProgram = asyncHandler<AuthRequest>(async (req, res) => {
  const program = await Program.create({ ...req.body, owner: req.userId });
  res.status(201).json(program);
});

export const updateProgram = asyncHandler(async (req, res) => {
  const { id, ...data } = req.body;
  const program = await Program.findByIdAndUpdate(id, data, { new: true });
  if (!program) throw HttpError.notFound('Program introuvable');
  res.json(program);
});

export const deleteProgram = asyncHandler(async (req, res) => {
  await Program.findByIdAndUpdate(req.params['id'], { deleted: true });
  res.json({ message: 'Program supprimé' });
});
