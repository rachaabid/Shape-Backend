import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { sendInterviewInvite, sendInterviewConfirmation, sendInterviewReminder } from '../services/email.service';
import { authMiddleware } from '../middleware/auth.middleware';
import User from '../models/User';
import nodemailer from 'nodemailer';

const router = Router();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST, port: Number(process.env.MAIL_PORT) || 587,
  secure: false, auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
});

// POST /api/email/send-code  — send verification code
router.post('/send-code', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    await User.findOneAndUpdate({ email }, { verificationCode: code });

    await transporter.sendMail({
      from: process.env.MAIL_FROM, to: email,
      subject: 'Code de vérification Shape',
      html: `<h2>Votre code : <strong>${code}</strong></h2><p>Valide 10 minutes.</p>`,
    });
    res.json({ message: 'Code envoyé' });
  } catch (err) { res.status(500).json({ error: err }); }
});

// POST /api/email/verify-code
router.post('/verify-code', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email, verificationCode: code });
    if (!user) { res.status(400).json({ message: 'Code invalide' }); return; }
    await User.findByIdAndUpdate(user._id, { verifiedAccount: true, verificationCode: undefined });
    res.json({ message: 'Compte vérifié' });
  } catch (err) { res.status(500).json({ error: err }); }
});

// Interview email endpoints (used by AI matching)
router.post('/interview-invite',       authMiddleware, async (req, res) => {
  try { await sendInterviewInvite({ ...req.body, frontendUrl: process.env.FRONTEND_URL! }); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ error: err }); }
});
router.post('/interview-confirmation', authMiddleware, async (req, res) => {
  try { await sendInterviewConfirmation({ ...req.body, frontendUrl: process.env.FRONTEND_URL! }); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ error: err }); }
});
router.post('/interview-reminder',     authMiddleware, async (req, res) => {
  try { await sendInterviewReminder({ ...req.body, frontendUrl: process.env.FRONTEND_URL! }); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ error: err }); }
});

export default router;
