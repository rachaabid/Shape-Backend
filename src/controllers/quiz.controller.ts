import Quiz from '../models/Quiz';
import QuizResponse from '../models/QuizResponse';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { HttpError }    from '../utils/HttpError';

const paginate = (req: { query: any }) => ({
  start: parseInt(req.query['start'] as string) || 0,
  count: parseInt(req.query['count'] as string) || 100,
});

// ── Quiz ──────────────────────────────────────────────────────

export const countQuizzes = asyncHandler(async (_req, res) =>
  res.json(await Quiz.countDocuments({ deleted: { $ne: true } })));

export const getQuizzesByAttribute = asyncHandler(async (req, res) => {
  const { attributeName, value } = req.params;
  const { start, count } = paginate(req);
  res.json(
    await Quiz.find({ [attributeName]: value, deleted: { $ne: true } })
      .skip(start).limit(count),
  );
});

export const countQuizzesByAttribute = asyncHandler(async (req, res) => {
  const { attributeName, value } = req.params;
  res.json(await Quiz.countDocuments({ [attributeName]: value, deleted: { $ne: true } }));
});

export const getQuizById = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params['id']);
  if (!quiz) throw HttpError.notFound('Quiz non trouvé');
  res.json(quiz);
});

export const getAllQuizzes = asyncHandler(async (req, res) => {
  const { start, count } = paginate(req);
  res.json(await Quiz.find({ deleted: { $ne: true } }).skip(start).limit(count));
});

export const createQuiz = asyncHandler(async (req, res) =>
  res.status(201).json(await Quiz.create(req.body)));

export const updateQuiz = asyncHandler(async (req, res) => {
  const { id, ...rest } = req.body;
  res.json(await Quiz.findByIdAndUpdate(id, rest, { new: true }));
});

export const patchQuiz = asyncHandler(async (req, res) => {
  const { id, ...rest } = req.body;
  res.json(await Quiz.findByIdAndUpdate(id, { $set: rest }, { new: true }));
});

export const deleteQuiz = asyncHandler(async (req, res) => {
  await Quiz.findByIdAndUpdate(req.params['id'], { deleted: true });
  res.json({ message: 'Supprimé' });
});

// ── QuizResponse ──────────────────────────────────────────────

export const countQuizResponses = asyncHandler(async (_req, res) =>
  res.json(await QuizResponse.countDocuments({ deleted: { $ne: true } })));

export const getQuizResponsesByAttribute = asyncHandler(async (req, res) => {
  const { attributeName, value } = req.params;
  const { start, count } = paginate(req);
  const filter: Record<string, unknown> = { deleted: { $ne: true } };
  if (attributeName === 'quiz')        filter['quiz']        = value;
  if (attributeName === 'inscription') filter['inscription'] = value;
  if (attributeName === 'owner')       filter['owner']       = value;
  res.json(
    await QuizResponse.find(filter).populate('quiz').skip(start).limit(count),
  );
});

export const countQuizResponsesByAttribute = asyncHandler(async (req, res) => {
  const { attributeName, value } = req.params;
  res.json(await QuizResponse.countDocuments({ [attributeName]: value, deleted: { $ne: true } }));
});

export const getQuizResponseById = asyncHandler(async (req, res) => {
  const item = await QuizResponse.findById(req.params['id']).populate('quiz');
  if (!item) throw HttpError.notFound();
  res.json(item);
});

export const getAllQuizResponses = asyncHandler(async (_req, res) =>
  res.json(await QuizResponse.find({ deleted: { $ne: true } }).populate('quiz')));

export const createQuizResponse = asyncHandler<AuthRequest>(async (req, res) => {
  const owner       = req.body.owner || req.userId;
  const quizId      = req.body.quiz;
  const inscription = req.body.inscription;

  // Upsert : une seule réponse par (owner, quiz) — update si déjà soumise.
  const filter: any = { owner, quiz: quizId, deleted: { $ne: true } };
  if (inscription) filter.inscription = inscription;

  const item = await QuizResponse.findOneAndUpdate(
    filter,
    { $set: { reponses: req.body.reponses, inscription, updatedAt: new Date() } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  res.status(200).json(item);
});

export const updateQuizResponse = asyncHandler(async (req, res) => {
  const { id, ...rest } = req.body;
  res.json(await QuizResponse.findByIdAndUpdate(id, rest, { new: true }));
});

export const patchQuizResponse = asyncHandler(async (req, res) => {
  const { id, ...rest } = req.body;
  res.json(await QuizResponse.findByIdAndUpdate(id, { $set: rest }, { new: true }));
});

export const deleteQuizResponse = asyncHandler(async (req, res) => {
  await QuizResponse.findByIdAndUpdate(req.params['id'], { deleted: true });
  res.json({ message: 'Supprimé' });
});
