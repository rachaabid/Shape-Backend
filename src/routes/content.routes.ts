import { Router } from 'express';
import Documentation from '../models/Documentation';
import TextBloc      from '../models/TextBloc';
import Video         from '../models/Video';
import VideoYoutube  from '../models/VideoYoutube';
import ImageContent  from '../models/ImageContent';
import { createCrudRouter } from './crud.helper';

const router = Router();

// Mount all content-type CRUD routers (Documentation, TextBloc, Video, VideoYoutube, Image)
router.use(createCrudRouter(Documentation, 'Documentation'));
router.use(createCrudRouter(TextBloc,      'TextBloc'));
router.use(createCrudRouter(Video,         'Video'));
router.use(createCrudRouter(VideoYoutube,  'VideoYoutube'));
router.use(createCrudRouter(ImageContent,  'Image'));

export default router;
