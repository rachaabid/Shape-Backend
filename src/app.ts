import dotenv from 'dotenv';
dotenv.config(); // doit s'exécuter avant tout import de module qui lit process.env

import express  from 'express';
import cors     from 'cors';
import mongoose from 'mongoose';

import userRoutes                from './routes/user.routes';
import companyRoutes             from './routes/company.routes';
import jobOfferRoutes            from './routes/jobOffer.routes';
import applicationRoutes         from './routes/application.routes';
import notificationRoutes        from './routes/notification.routes';
import notificationSettingRoutes from './routes/notificationSetting.routes';
import emailRoutes               from './routes/email.routes';
import storageRoutes             from './routes/storage.routes';
import referenceRoutes           from './routes/reference.routes';
import taskRoutes                from './routes/task.routes';
import inscriptionRoutes         from './routes/inscription.routes';
import interviewRoutes           from './routes/interview.routes';
import agoraRoutes               from './routes/agora.routes';

import { startScheduler } from './services/scheduler.service';

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/User',                userRoutes);
app.use('/api/Company',             companyRoutes);
app.use('/api/JobOffer',            jobOfferRoutes);
app.use('/api/JobOfferApplication', applicationRoutes);
app.use('/api/Notification',        notificationRoutes);
app.use('/api/email',               emailRoutes);  // lowercase pour send-code/verify-code
app.use('/api/Email',               emailRoutes);  // uppercase pour interview-invite/confirmation/reminder
app.use('/api/Storage',             storageRoutes);
app.use('/api/Inscription',         inscriptionRoutes);
app.use('/api/Interview',           interviewRoutes);
app.use('/api/agora',               agoraRoutes);

// Référence : Language, Country, HardSkill, SoftwareSkill, FocusedSkill, Program, WorkingMode, JobOfferModel
app.use('/api', referenceRoutes);

// Task + TaskResponse (routes préfixées /Task et /TaskResponse en interne)
app.use('/api', taskRoutes);

// NotificationSetting (route préfixée /NotificationSetting en interne)
app.use('/api', notificationSettingRoutes);

// ── MongoDB ───────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => {
    console.log('✅ MongoDB connecté');
    startScheduler();
    app.listen(PORT, () => console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`));
  })
  .catch(err => console.error('❌ Erreur MongoDB :', err));
