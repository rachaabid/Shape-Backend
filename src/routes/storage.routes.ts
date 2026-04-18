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

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// Minimal Storage model (in-memory collection reference)
const StorageSchema = new mongoose.Schema({
  fileName: String, type: String, deleted: { type: Boolean, default: false }, url: String,
}, { timestamps: true });
const StorageModel = mongoose.models['Storage'] || mongoose.model('Storage', StorageSchema);

// POST /api/Storage
router.post('/', authMiddleware, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ message: 'Fichier manquant' }); return; }
    const url  = `/api/Storage/${req.file.filename}`;
    const doc  = await StorageModel.create({ fileName: req.file.originalname, type: req.body.type || req.file.mimetype, url });
    res.status(201).json({ id: doc._id, url });
  } catch (err) { res.status(500).json({ error: err }); }
});

// GET /api/Storage/:fileId  — serve file or get metadata
router.get('/:fileId', async (req: Request, res: Response) => {
  try {
    // try as filename first
    const filePath = path.join(UPLOAD_DIR, req.params.fileId);
    if (fs.existsSync(filePath)) { res.sendFile(filePath); return; }

    // try as mongo id
    const doc = await StorageModel.findById(req.params.fileId);
    if (!doc) { res.status(404).json({ message: 'Fichier non trouvé' }); return; }
    const docPath = path.join(UPLOAD_DIR, path.basename(doc.url));
    if (fs.existsSync(docPath)) res.sendFile(docPath);
    else res.json(doc);
  } catch (err) { res.status(500).json({ error: err }); }
});

export default router;
