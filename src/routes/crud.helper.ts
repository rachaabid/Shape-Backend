import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';

export function createCrudRouter(Model: any, resourceName: string): Router {
  const router = Router();

  router.get(`/${resourceName}/count`, authMiddleware, async (_req: Request, res: Response) => {
    try { res.json(await Model.countDocuments({ deleted: { $ne: true } })); }
    catch (err) { res.status(500).json({ error: err }); }
  });

  router.get(`/${resourceName}/ByAttribute/:attributeName/:value`, authMiddleware, async (req: Request, res: Response) => {
    try {
      const { attributeName, value } = req.params;
      const start = parseInt(req.query['start'] as string) || 0;
      const count = parseInt(req.query['count'] as string) || 100;
      const items = await Model.find({ [attributeName]: value, deleted: { $ne: true } }).skip(start).limit(count);
      res.json(items);
    } catch (err) { res.status(500).json({ error: err }); }
  });

  router.get(`/${resourceName}/ByAttributeCount/:attributeName/:value`, authMiddleware, async (req: Request, res: Response) => {
    try {
      const { attributeName, value } = req.params;
      res.json(await Model.countDocuments({ [attributeName]: value, deleted: { $ne: true } }));
    } catch (err) { res.status(500).json({ error: err }); }
  });

  router.get(`/${resourceName}/:id`, authMiddleware, async (req: Request, res: Response) => {
    try {
      const item = await Model.findById(req.params.id);
      if (!item) { res.status(404).json({ message: 'Non trouvé' }); return; }
      res.json(item);
    } catch (err) { res.status(500).json({ error: err }); }
  });

  router.get(`/${resourceName}`, authMiddleware, async (req: Request, res: Response) => {
    try {
      const start = parseInt(req.query['start'] as string) || 0;
      const count = parseInt(req.query['count'] as string) || 100;
      res.json(await Model.find({ deleted: { $ne: true } }).skip(start).limit(count));
    } catch (err) { res.status(500).json({ error: err }); }
  });

  router.post(`/${resourceName}`, authMiddleware, async (req: Request, res: Response) => {
    try { res.status(201).json(await Model.create(req.body)); }
    catch (err) { res.status(500).json({ error: err }); }
  });

  router.put(`/${resourceName}`, authMiddleware, async (req: Request, res: Response) => {
    try {
      const { id, ...rest } = req.body;
      res.json(await Model.findByIdAndUpdate(id, rest, { new: true }));
    } catch (err) { res.status(500).json({ error: err }); }
  });

  router.patch(`/${resourceName}`, authMiddleware, async (req: Request, res: Response) => {
    try {
      const { id, ...rest } = req.body;
      res.json(await Model.findByIdAndUpdate(id, { $set: rest }, { new: true }));
    } catch (err) { res.status(500).json({ error: err }); }
  });

  router.delete(`/${resourceName}/:id`, authMiddleware, async (req: Request, res: Response) => {
    try {
      await Model.findByIdAndUpdate(req.params.id, { deleted: true });
      res.json({ message: 'Supprimé' });
    } catch (err) { res.status(500).json({ error: err }); }
  });

  return router;
}
