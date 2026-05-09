import { Router, Request, Response } from 'express';
import Inscription from '../models/Inscription';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// GET /my-mentor → inscription du shaper connecté avec mentor peuplé
router.get('/my-mentor', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const inscription = await Inscription.findOne({ user: req.userId, deleted: false })
      .populate('mentor', '-password')
      .populate('user', '-password');
    res.json(inscription ?? null);
  } catch (err) { res.status(500).json({ error: err }); }
});

router.get('/count', authMiddleware, async (_req: Request, res: Response) => {
  try { res.json(await Inscription.countDocuments({ deleted: false })); }
  catch (err) { res.status(500).json({ error: err }); }
});

// GET /byattribute/User/:userId → inscriptions de l'utilisateur (tableau)
router.get('/byattribute/User/:userId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const inscriptions = await Inscription.find({ user: req.params['userId'], deleted: false })
      .populate('user', '-password');
    res.json(inscriptions);
  } catch (err) { res.status(500).json({ error: err }); }
});

router.get('/', authMiddleware, async (_req: Request, res: Response) => {
  try { res.json(await Inscription.find({ deleted: false }).populate('user', '-password').populate('programs')); }
  catch (err) { res.status(500).json({ error: err }); }
});

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try { res.status(201).json(await Inscription.create(req.body)); }
  catch (err) { res.status(500).json({ error: err }); }
});

export default router;
