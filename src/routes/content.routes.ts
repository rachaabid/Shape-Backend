import { Router } from 'express';
import Documentation from '../models/Documentation';
import TextBloc      from '../models/TextBloc';
import Video         from '../models/Video';
import VideoYoutube  from '../models/VideoYoutube';
import ImageContent  from '../models/ImageContent';
import { createCrudRouter } from './crud.helper';

const router = Router();

// Content-type CRUD routers
router.use(createCrudRouter(Documentation, 'Documentation'));
router.use(createCrudRouter(TextBloc,      'TextBloc'));
router.use(createCrudRouter(Video,         'Video'));   // source='upload' | 'youtube'
router.use(createCrudRouter(ImageContent,  'Image'));

// Lecture seule sur VideoYoutube — compatibilité avec les données existantes.
// Les nouvelles vidéos YouTube sont créées via /Video avec source='youtube'.
router.get('/VideoYoutube',     async (_req, res) => { res.json(await VideoYoutube.find({ deleted: { $ne: true } })); });
router.get('/VideoYoutube/:id', async (req, res)  => {
  const doc = await VideoYoutube.findById(req.params['id']);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  return res.json(doc);
});

export default router;
