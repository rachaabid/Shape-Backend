import { Router, Request, Response } from 'express';
import Inscription from '../models/Inscription';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/count', authMiddleware, async (_req: Request, res: Response) => {
  try { res.json(await Inscription.countDocuments({ deleted: false })); }
  catch (err) { res.status(500).json({ error: err }); }
});

router.get('/', authMiddleware, async (_req: Request, res: Response) => {
  try { res.json(await Inscription.find({ deleted: false }).populate('user', '-password').populate('program')); }
  catch (err) { res.status(500).json({ error: err }); }
});

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try { res.status(201).json(await Inscription.create(req.body)); }
  catch (err) { res.status(500).json({ error: err }); }
});

export default router;
