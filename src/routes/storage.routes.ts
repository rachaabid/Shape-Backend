import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } }); // 500MB

// Minimal Storage model (in-memory collection reference)
const StorageSchema = new mongoose.Schema({
  fileName: String, type: String, deleted: { type: Boolean, default: false }, url: String,
}, { timestamps: true });
const StorageModel = mongoose.models['Storage'] || mongoose.model('Storage', StorageSchema);

// POST /api/Storage
router.post('/', authMiddleware, (req: AuthRequest, res: Response, next) => {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      console.error('[storage] upload error:', err);
      const msg = err.code === 'LIMIT_FILE_SIZE'
        ? `Fichier trop volumineux (limite 500MB)`
        : (err.message || 'Échec de l’upload');
      return res.status(400).json({ message: msg });
    }
    next();
  });
}, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ message: 'Fichier manquant' }); return; }
    const url  = `/api/Storage/${req.file.filename}`;
    const doc  = await StorageModel.create({ fileName: req.file.originalname, type: req.body.type || req.file.mimetype, url });
    res.status(201).json({ id: doc._id, url });
  } catch (err: any) {
    console.error('[storage] save error:', err);
    res.status(500).json({ message: err?.message || 'Erreur serveur', error: err });
  }
});

function mimeTypeFor(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.mp4':  return 'video/mp4';
    case '.webm': return 'video/webm';
    case '.ogg':  return 'video/ogg';
    case '.mov':  return 'video/quicktime';
    case '.mkv':  return 'video/x-matroska';
    case '.mp3':  return 'audio/mpeg';
    case '.wav':  return 'audio/wav';
    case '.pdf':  return 'application/pdf';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.png':  return 'image/png';
    case '.gif':  return 'image/gif';
    case '.svg':  return 'image/svg+xml';
    default:      return 'application/octet-stream';
  }
}

function streamFile(req: Request, res: Response, filePath: string) {
  const stat = fs.statSync(filePath);
  const total = stat.size;
  const type  = mimeTypeFor(filePath);
  const range = req.headers.range;

  if (range) {
    const m = /bytes=(\d+)-(\d*)/.exec(range);
    if (!m) { res.status(416).end(); return; }
    const start = parseInt(m[1], 10);
    const end   = m[2] ? parseInt(m[2], 10) : total - 1;
    if (start >= total || end >= total) {
      res.status(416).set('Content-Range', `bytes */${total}`).end();
      return;
    }
    res.status(206).set({
      'Content-Range':  `bytes ${start}-${end}/${total}`,
      'Accept-Ranges':  'bytes',
      'Content-Length': end - start + 1,
      'Content-Type':   type,
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.set({
      'Content-Length': total,
      'Content-Type':   type,
      'Accept-Ranges':  'bytes',
    });
    fs.createReadStream(filePath).pipe(res);
  }
}

// GET /api/Storage/:fileId  — stream file with Range support (so video seek
// works, and the browser keeps fullscreen/volume controls enabled).
router.get('/:fileId', async (req: Request, res: Response) => {
  try {
    const filePath = path.join(UPLOAD_DIR, req.params.fileId);
    if (fs.existsSync(filePath)) { streamFile(req, res, filePath); return; }

    const doc = await StorageModel.findById(req.params.fileId);
    if (!doc) { res.status(404).json({ message: 'Fichier non trouvé' }); return; }
    const docPath = path.join(UPLOAD_DIR, path.basename(doc.url));
    if (fs.existsSync(docPath)) streamFile(req, res, docPath);
    else res.json(doc);
  } catch (err) {
    console.error('[storage] read error:', err);
    res.status(500).json({ error: err });
  }
});

export default router;
