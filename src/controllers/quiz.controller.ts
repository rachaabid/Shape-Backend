import Quiz from '../models/Quiz';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { HttpError }    from '../utils/HttpError';

const paginate = (req: { query: any }) => ({
  start: parseInt(req.query['start'] as string) || 0,
  count: parseInt(req.query['count'] as string) || 100,
});

// ── Helpers (modèle Quiz unifié : réponses imbriquées) ───────────────────────

function quizPlain(q: any) {
  const o = q?.toObject ? q.toObject() : q;
  if (!o) return o;
  const { responses, ...rest } = o;
  return rest;
}

function mapResponse(quiz: any, r: any, opts: { populateQuiz?: boolean } = {}) {
  const rr = r?.toObject ? r.toObject() : r;
  return {
    ...rr,
    id:   rr._id,
    quiz: opts.populateQuiz ? quizPlain(quiz) : quiz._id,
  };
}

async function allQuizResponses(): Promise<{ quiz: any; r: any }[]> {
  const quizzes = await Quiz.find({ deleted: { $ne: true } });
  const out: { quiz: any; r: any }[] = [];
  quizzes.forEach(q => (q.responses || []).forEach((r: any) => { if (!r.deleted) out.push({ quiz: q, r }); }));
  return out;
}

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
  const { id, responses, ...rest } = req.body;
  res.json(await Quiz.findByIdAndUpdate(id, rest, { new: true }));
});

export const patchQuiz = asyncHandler(async (req, res) => {
  const { id, responses, ...rest } = req.body;
  res.json(await Quiz.findByIdAndUpdate(id, { $set: rest }, { new: true }));
});

export const deleteQuiz = asyncHandler(async (req, res) => {
  await Quiz.findByIdAndUpdate(req.params['id'], { deleted: true });
  res.json({ message: 'Supprimé' });
});

// ── QuizResponse (réponses imbriquées — API préservée) ───────────────────────

export const countQuizResponses = asyncHandler(async (_req, res) =>
  res.json((await allQuizResponses()).length));

export const getQuizResponsesByAttribute = asyncHandler(async (req, res) => {
  const { attributeName, value } = req.params;
  const { start, count } = paginate(req);
  let pairs: { quiz: any; r: any }[] = [];

  if (attributeName === 'quiz') {
    const q = await Quiz.findById(value);
    if (q) (q.responses || []).forEach((r: any) => { if (!r.deleted) pairs.push({ quiz: q, r }); });
  } else {
    const all = await allQuizResponses();
    pairs = all.filter(({ r }) => String((r as any)[attributeName]) === String(value));
  }
  res.json(pairs.slice(start, start + count).map(p => mapResponse(p.quiz, p.r, { populateQuiz: true })));
});

export const countQuizResponsesByAttribute = asyncHandler(async (req, res) => {
  const { attributeName, value } = req.params;
  const all = await allQuizResponses();
  res.json(all.filter(({ r }) => String((r as any)[attributeName]) === String(value)).length);
});

export const getQuizResponseById = asyncHandler(async (req, res) => {
  const id = req.params['id'];
  const quiz = await Quiz.findOne({ 'responses._id': id });
  const r = quiz && (quiz.responses as any).id(id);
  if (!quiz || !r) throw HttpError.notFound();
  res.json(mapResponse(quiz, r, { populateQuiz: true }));
});

export const getAllQuizResponses = asyncHandler(async (_req, res) => {
  const pairs = await allQuizResponses();
  res.json(pairs.map(p => mapResponse(p.quiz, p.r, { populateQuiz: true })));
});

export const createQuizResponse = asyncHandler<AuthRequest>(async (req, res) => {
  const owner       = req.body.owner || req.userId;
  const quizId      = req.body.quiz;
  const inscription = req.body.inscription;

  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw HttpError.notFound('Quiz non trouvé');
  quiz.responses = quiz.responses || [];

  // Upsert : une seule réponse par (owner, quiz)
  let r: any = (quiz.responses as any[]).find(
    x => !x.deleted && String(x.owner) === String(owner) &&
         (!inscription || String(x.inscription) === String(inscription)),
  );
  if (r) {
    r.reponses = req.body.reponses;
    if (inscription) r.inscription = inscription;
  } else {
    (quiz.responses as any).push({ owner, inscription, reponses: req.body.reponses });
    r = quiz.responses[quiz.responses.length - 1];
  }
  await quiz.save();
  res.status(200).json(mapResponse(quiz, r, { populateQuiz: true }));
});

export const updateQuizResponse = asyncHandler(async (req, res) => {
  const { id, quiz: _q, ...rest } = req.body;
  const quiz = await Quiz.findOne({ 'responses._id': id });
  const r = quiz && (quiz.responses as any).id(id);
  if (!quiz || !r) throw HttpError.notFound();
  ['reponses', 'inscription', 'owner', 'deleted'].forEach(k => { if (rest[k] !== undefined) (r as any)[k] = rest[k]; });
  await quiz.save();
  res.json(mapResponse(quiz, r, { populateQuiz: true }));
});

export const patchQuizResponse = asyncHandler(async (req, res) => {
  const { id, quiz: _q, ...rest } = req.body;
  const quiz = await Quiz.findOne({ 'responses._id': id });
  const r = quiz && (quiz.responses as any).id(id);
  if (!quiz || !r) throw HttpError.notFound();
  Object.assign(r as any, rest);
  await quiz.save();
  res.json(mapResponse(quiz, r, { populateQuiz: true }));
});

export const deleteQuizResponse = asyncHandler(async (req, res) => {
  const id = req.params['id'];
  const quiz = await Quiz.findOne({ 'responses._id': id });
  const r = quiz && (quiz.responses as any).id(id);
  if (quiz && r) { (r as any).deleted = true; await quiz.save(); }
  res.json({ message: 'Supprimé' });
});
