import { Router, Request, Response } from 'express';
import Quiz        from '../models/Quiz';
import QuizResponse from '../models/QuizResponse';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// ── Quiz CRUD ─────────────────────────────────────────────────

router.get('/Quiz/count', authMiddleware, async (_req: Request, res: Response) => {
  try { res.json(await Quiz.countDocuments({ deleted: { $ne: true } })); }
  catch (err) { res.status(500).json({ error: err }); }
});

router.get('/Quiz/ByAttribute/:attributeName/:value', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { attributeName, value } = req.params;
    const start = parseInt(req.query['start'] as string) || 0;
    const count = parseInt(req.query['count'] as string) || 100;
    res.json(await Quiz.find({ [attributeName]: value, deleted: { $ne: true } }).skip(start).limit(count));
  } catch (err) { res.status(500).json({ error: err }); }
});

router.get('/Quiz/ByAttributeCount/:attributeName/:value', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { attributeName, value } = req.params;
    res.json(await Quiz.countDocuments({ [attributeName]: value, deleted: { $ne: true } }));
  } catch (err) { res.status(500).json({ error: err }); }
});

router.get('/Quiz/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) { res.status(404).json({ message: 'Quiz non trouvé' }); return; }
    res.json(quiz);
  } catch (err) { res.status(500).json({ error: err }); }
});

router.get('/Quiz', authMiddleware, async (req: Request, res: Response) => {
  try {
    const start = parseInt(req.query['start'] as string) || 0;
    const count = parseInt(req.query['count'] as string) || 100;
    res.json(await Quiz.find({ deleted: { $ne: true } }).skip(start).limit(count));
  } catch (err) { res.status(500).json({ error: err }); }
});

router.post('/Quiz', authMiddleware, async (req: Request, res: Response) => {
  try { res.status(201).json(await Quiz.create(req.body)); }
  catch (err) { res.status(500).json({ error: err }); }
});

router.put('/Quiz', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id, ...rest } = req.body;
    res.json(await Quiz.findByIdAndUpdate(id, rest, { new: true }));
  } catch (err) { res.status(500).json({ error: err }); }
});

router.patch('/Quiz', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id, ...rest } = req.body;
    res.json(await Quiz.findByIdAndUpdate(id, { $set: rest }, { new: true }));
  } catch (err) { res.status(500).json({ error: err }); }
});

router.delete('/Quiz/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    await Quiz.findByIdAndUpdate(req.params.id, { deleted: true });
    res.json({ message: 'Supprimé' });
  } catch (err) { res.status(500).json({ error: err }); }
});

// ── QuizResponse CRUD ─────────────────────────────────────────

router.get('/QuizResponse/count', authMiddleware, async (_req: Request, res: Response) => {
  try { res.json(await QuizResponse.countDocuments({ deleted: { $ne: true } })); }
  catch (err) { res.status(500).json({ error: err }); }
});

router.get('/QuizResponse/ByAttribute/:attributeName/:value', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { attributeName, value } = req.params;
    const start = parseInt(req.query['start'] as string) || 0;
    const count = parseInt(req.query['count'] as string) || 100;
    const filter: Record<string, unknown> = { deleted: { $ne: true } };
    if (attributeName === 'quiz')        filter['quiz']        = value;
    if (attributeName === 'inscription') filter['inscription'] = value;
    if (attributeName === 'owner')       filter['owner']       = value;
    const items = await QuizResponse.find(filter).populate('quiz').skip(start).limit(count);
    res.json(items);
  } catch (err) { res.status(500).json({ error: err }); }
});

router.get('/QuizResponse/ByAttributeCount/:attributeName/:value', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { attributeName, value } = req.params;
    res.json(await QuizResponse.countDocuments({ [attributeName]: value, deleted: { $ne: true } }));
  } catch (err) { res.status(500).json({ error: err }); }
});

router.get('/QuizResponse/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const item = await QuizResponse.findById(req.params.id).populate('quiz');
    if (!item) { res.status(404).json({ message: 'Non trouvé' }); return; }
    res.json(item);
  } catch (err) { res.status(500).json({ error: err }); }
});

router.get('/QuizResponse', authMiddleware, async (_req: Request, res: Response) => {
  try { res.json(await QuizResponse.find({ deleted: { $ne: true } }).populate('quiz')); }
  catch (err) { res.status(500).json({ error: err }); }
});

router.post('/QuizResponse', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const owner       = req.body.owner || req.userId;
    const quizId      = req.body.quiz;
    const inscription = req.body.inscription;

    // Upsert: one response per (owner, quiz) pair — update if already submitted
    const filter: any = { owner, quiz: quizId, deleted: { $ne: true } };
    if (inscription) filter.inscription = inscription;

    const item = await QuizResponse.findOneAndUpdate(
      filter,
      { $set: { reponses: req.body.reponses, inscription, updatedAt: new Date() } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(200).json(item);
  } catch (err) { res.status(500).json({ error: err }); }
});

router.put('/QuizResponse', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id, ...rest } = req.body;
    res.json(await QuizResponse.findByIdAndUpdate(id, rest, { new: true }));
  } catch (err) { res.status(500).json({ error: err }); }
});

router.patch('/QuizResponse', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id, ...rest } = req.body;
    res.json(await QuizResponse.findByIdAndUpdate(id, { $set: rest }, { new: true }));
  } catch (err) { res.status(500).json({ error: err }); }
});

router.delete('/QuizResponse/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    await QuizResponse.findByIdAndUpdate(req.params.id, { deleted: true });
    res.json({ message: 'Supprimé' });
  } catch (err) { res.status(500).json({ error: err }); }
});

export default router;
