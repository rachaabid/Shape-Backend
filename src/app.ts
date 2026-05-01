import dotenv from 'dotenv';
dotenv.config();

import express         from 'express';
import cors            from 'cors';
import mongoose        from 'mongoose';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import jwt             from 'jsonwebtoken';

import userRoutes                  from './routes/user.routes';
import companyRoutes               from './routes/company.routes';
import jobOfferRoutes              from './routes/jobOffer.routes';
import applicationRoutes           from './routes/application.routes';
import notificationRoutes          from './routes/notification.routes';
import notificationSettingRoutes   from './routes/notificationSetting.routes';
import emailRoutes                 from './routes/email.routes';
import storageRoutes               from './routes/storage.routes';
import referenceRoutes             from './routes/reference.routes';
import taskRoutes                  from './routes/task.routes';
import inscriptionRoutes           from './routes/inscription.routes';
import interviewRoutes             from './routes/interview.routes';
import agoraRoutes                 from './routes/agora.routes';
import conversationRoutes          from './routes/conversation.routes';
import statsRoutes                 from './routes/stats.routes';
import quizRoutes                  from './routes/quiz.routes';
import contentRoutes               from './routes/content.routes';
import taskResponseCommentRoutes   from './routes/taskResponseComment.routes';

import Conversation from './models/Conversation';
import Message      from './models/Message';

import { startScheduler } from './services/scheduler.service';

const app        = express();
const httpServer = createServer(app);
const PORT       = process.env.PORT || 3000;

// ── CORS ──────────────────────────────────────────────────────
const corsOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:4200'];

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Socket.io ─────────────────────────────────────────────────
const io = new SocketServer(httpServer, {
  cors: { origin: corsOrigins, credentials: true },
});

// Auth middleware socket.io
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth['token'] as string;
    if (!token) return next(new Error('Non authentifié'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    socket.data['userId'] = decoded.id;
    next();
  } catch {
    next(new Error('Token invalide'));
  }
});

io.on('connection', (socket) => {
  const userId: string = socket.data['userId'];

  // Rejoindre la salle personnelle
  socket.join(`user:${userId}`);

  // ── Envoyer un message ────────────────────────────────────
  socket.on('send-message', async (payload: {
    conversationId: string;
    content:  string;
    type?:    string;
    fileUrl?: string;
    fileName?: string;
  }) => {
    try {
      const convo = await Conversation.findById(payload.conversationId);
      if (!convo) return;

      // Créer le message
      const msg = await Message.create({
        conversationId: payload.conversationId,
        sender:         userId,
        content:        payload.content,
        type:           payload.type || 'text',
        fileUrl:        payload.fileUrl,
        fileName:       payload.fileName,
      });
      const populated = await msg.populate('sender', 'firstName lastName login avatar');

      // Mettre à jour la conversation
      const updates: Record<string, any> = {
        lastMessage:       payload.content,
        lastMessageAt:     new Date(),
        lastMessageSender: userId,
      };
      // Incrémenter unreadCount pour les autres participants
      for (const pid of convo.participants) {
        const pidStr = pid.toString();
        if (pidStr !== userId) {
          const current = (convo.unreadCounts as Map<string, number>).get(pidStr) || 0;
          updates[`unreadCounts.${pidStr}`] = current + 1;
        }
      }
      await Conversation.findByIdAndUpdate(payload.conversationId, { $set: updates });

      // Émettre à tous les participants
      for (const pid of convo.participants) {
        io.to(`user:${pid.toString()}`).emit('new-message', {
          message:        populated,
          conversationId: payload.conversationId,
        });
        // Notifier la mise à jour du compteur
        if (pid.toString() !== userId) {
          const convos = await Conversation.find({ participants: pid.toString() });
          let total = 0;
          for (const c of convos) {
            total += (c.unreadCounts as Map<string, number>).get(pid.toString()) || 0;
          }
          io.to(`user:${pid.toString()}`).emit('message-count-update', { total });
        }
      }
    } catch (err) {
      console.error('Socket send-message error:', err);
    }
  });

  // ── Typing indicators ────────────────────────────────────
  socket.on('typing', ({ conversationId }: { conversationId: string }) => {
    socket.to(`conv:${conversationId}`).emit('typing', { conversationId, userId });
  });

  socket.on('stop-typing', ({ conversationId }: { conversationId: string }) => {
    socket.to(`conv:${conversationId}`).emit('stop-typing', { conversationId, userId });
  });

  // ── Rejoindre la salle d'une conversation (pour typing) ──
  socket.on('join-conversation', ({ conversationId }: { conversationId: string }) => {
    socket.join(`conv:${conversationId}`);
  });

  // ── Marquer lu ───────────────────────────────────────────
  socket.on('mark-read', async ({ conversationId }: { conversationId: string }) => {
    try {
      await Message.updateMany(
        { conversationId, sender: { $ne: userId }, read: false },
        { read: true },
      );
      await Conversation.findByIdAndUpdate(conversationId, {
        $set: { [`unreadCounts.${userId}`]: 0 },
      });
    } catch (err) {
      console.error('Socket mark-read error:', err);
    }
  });

  socket.on('disconnect', () => {});
});

// ── REST Routes ───────────────────────────────────────────────
app.use('/api/User',                userRoutes);
app.use('/api/Company',             companyRoutes);
app.use('/api/JobOffer',            jobOfferRoutes);
app.use('/api/JobOfferApplication', applicationRoutes);
app.use('/api/Notification',        notificationRoutes);
app.use('/api/Email',               emailRoutes);
app.use('/api/Storage',             storageRoutes);
app.use('/api/Inscription',         inscriptionRoutes);
app.use('/api/Interview',           interviewRoutes);
app.use('/api/agora',               agoraRoutes);
app.use('/api/Conversation',        conversationRoutes);
app.use('/api/stats',               statsRoutes);
app.use('/api', referenceRoutes);
app.use('/api', taskRoutes);
app.use('/api', notificationSettingRoutes);
app.use('/api', quizRoutes);
app.use('/api', contentRoutes);
app.use('/api', taskResponseCommentRoutes);

// ── MongoDB + démarrage ───────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => {
    console.log('✅ MongoDB connecté');
    startScheduler();
    httpServer.listen(PORT, () =>
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`),
    );
  })
  .catch(err => console.error('❌ Erreur MongoDB :', err));
