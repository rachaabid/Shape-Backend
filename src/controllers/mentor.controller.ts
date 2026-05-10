import { Request, Response } from 'express';
import bcrypt   from 'bcryptjs';
import crypto   from 'crypto';
import User         from '../models/User';
import Inscription  from '../models/Inscription';
import Task         from '../models/Task';
import TaskResponse from '../models/TaskResponse';
import MentorEvaluation from '../models/MentorEvaluation';
import NotificationSetting from '../models/NotificationSetting';
import { AuthRequest }  from '../middleware/auth.middleware';
import { sendMentorCredentials } from '../services/email.service';
import { notifyAdmins }         from './notification.controller';

// ── Mentor: interns assigned to me ───────────────────────────────────────────

export const getMyInterns = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const inscriptions = await Inscription.find({
      mentor:  req.userId,
      deleted: { $ne: true },
    }).populate('user', '-password').populate('programs', 'title');
    res.json(inscriptions);
  } catch (err) { res.status(500).json({ error: err }); }
};

// ── Mentor stats ──────────────────────────────────────────────────────────────

export const getMentorStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [internCount, myTasks, myEvals, pendingReviews] = await Promise.all([
      Inscription.countDocuments({ mentor: req.userId, deleted: { $ne: true } }),
      Task.countDocuments({ createdBy: req.userId, deleted: { $ne: true } }),
      MentorEvaluation.countDocuments({ mentor: req.userId, deleted: { $ne: true } }),
      // Task responses with status=Review(2) for tasks created by this mentor
      Task.find({ createdBy: req.userId, deleted: { $ne: true } }).select('_id').then(tasks => {
        const ids = tasks.map(t => t._id);
        return TaskResponse.countDocuments({ task: { $in: ids }, status: 2, deleted: { $ne: true } });
      }),
    ]);
    res.json({ internCount, taskCount: myTasks, evalCount: myEvals, pendingReviews });
  } catch (err) { res.status(500).json({ error: err }); }
};

// ── Intern task responses ──────────────────────────────────────────────────────

export const getInternTaskResponses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { internId } = req.params;
    const responses = await TaskResponse.find({
      owner:   internId,
      deleted: { $ne: true },
    }).populate('task').populate('owner', '-password');
    res.json(responses);
  } catch (err) { res.status(500).json({ error: err }); }
};

// ── Tasks created by this mentor ───────────────────────────────────────────────

export const getMentorTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tasks = await Task.find({ createdBy: req.userId, deleted: { $ne: true } });
    res.json(tasks);
  } catch (err) { res.status(500).json({ error: err }); }
};

export const createMentorTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.create({ ...req.body, createdBy: req.userId });

    // Auto-create TaskResponse for each assigned intern (if inscriptionId provided)
    if (req.body.internIds?.length) {
      const responses = (req.body.internIds as string[]).map((uid: string) => ({
        task:   task._id,
        owner:  uid,
        status: 0,
      }));
      await TaskResponse.insertMany(responses);
    }
    res.status(201).json(task);
    setImmediate(() => notifyAdmins(
      'MENTOR_TASK',
      `Un mentor a créé une nouvelle tâche : "${task.title || 'Sans titre'}"`,
      { taskId: task._id.toString(), mentorId: req.userId }
    ).catch(() => {}));
  } catch (err) { res.status(500).json({ error: err }); }
};

export const deleteMentorTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Task.findByIdAndUpdate(req.params.id, { deleted: true });
    res.json({ message: 'Tâche supprimée' });
  } catch (err) { res.status(500).json({ error: err }); }
};

// ── Evaluations ────────────────────────────────────────────────────────────────

export const getEvaluations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { internId } = req.params;
    const evals = await MentorEvaluation.find({
      intern:  internId,
      deleted: { $ne: true },
    }).populate('mentor', '-password').sort({ createdAt: -1 });
    res.json(evals);
  } catch (err) { res.status(500).json({ error: err }); }
};

export const getMyEvaluations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const evals = await MentorEvaluation.find({
      mentor:  req.userId,
      deleted: { $ne: true },
    }).populate('intern', '-password').sort({ createdAt: -1 });
    res.json(evals);
  } catch (err) { res.status(500).json({ error: err }); }
};

export const createEvaluation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { intern, inscription, period, technical, behavior, communication, initiative, comment } = req.body;
    const globalScore = Math.round(((technical + behavior + communication + initiative) / 4) * 10) / 10;
    const ev = await MentorEvaluation.create({
      mentor: req.userId, intern, inscription, period,
      technical, behavior, communication, initiative, globalScore, comment,
    });
    res.status(201).json(ev);
    setImmediate(() => notifyAdmins(
      'MENTOR_EVALUATION',
      `Un mentor a soumis une évaluation (score global : ${ev.globalScore}/10)`,
      { evalId: ev._id.toString(), mentorId: req.userId }
    ).catch(() => {}));
  } catch (err) { res.status(500).json({ error: err }); }
};

export const updateEvaluation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, technical, behavior, communication, initiative, ...rest } = req.body;
    const globalScore = Math.round(((technical + behavior + communication + initiative) / 4) * 10) / 10;
    const ev = await MentorEvaluation.findByIdAndUpdate(
      id,
      { technical, behavior, communication, initiative, globalScore, ...rest },
      { new: true },
    );
    res.json(ev);
  } catch (err) { res.status(500).json({ error: err }); }
};

export const deleteEvaluation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await MentorEvaluation.findByIdAndUpdate(req.params.id, { deleted: true });
    res.json({ message: 'Évaluation supprimée' });
  } catch (err) { res.status(500).json({ error: err }); }
};

// ── Admin: assign mentor to inscription ───────────────────────────────────────

export const assignMentor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { inscriptionId, mentorId } = req.body;
    const inscription = await Inscription.findByIdAndUpdate(
      inscriptionId,
      { mentor: mentorId },
      { new: true },
    ).populate('user', '-password').populate('mentor', '-password');
    res.json(inscription);
  } catch (err) { res.status(500).json({ error: err }); }
};

// ── Admin: list all mentors ────────────────────────────────────────────────────

export const getMentors = async (_req: Request, res: Response): Promise<void> => {
  try {
    const mentors = await User.find({ roles: 'MENTOR', deleted: false }).select('-password');
    res.json(mentors);
  } catch (err) { res.status(500).json({ error: err }); }
};

// ── Admin: create mentor account + send credentials email ─────────────────────

export const createMentor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email: rawEmail, firstName, lastName, expertise } = req.body;
    const email = rawEmail?.toLowerCase().trim();

    const existingByEmail = await User.findOne({ email });
    if (existingByEmail) {
      if (!existingByEmail.deleted) {
        res.status(400).json({ message: 'Email déjà utilisé par un compte actif.' });
        return;
      }
      await User.findByIdAndDelete(existingByEmail._id);
    }

    const tempPassword = crypto.randomBytes(4).toString('hex');
    const hashed       = await bcrypt.hash(tempPassword, 10);
    const login        = email.split('@')[0] + '_mentor';

    const existingByLogin = await User.findOne({ login });
    if (existingByLogin) {
      if (!existingByLogin.deleted) {
        res.status(400).json({ message: `Le login "${login}" est déjà utilisé par un compte actif.` });
        return;
      }
      await User.findByIdAndDelete(existingByLogin._id);
    }

    const mentor = await User.create({
      email,
      login,
      password:        hashed,
      roles:           ['MENTOR'],
      firstName:       { fr: firstName, en: firstName },
      lastName:        { fr: lastName,  en: lastName  },
      verifiedAccount: true,
      expertise:       expertise || '',
      mustChangePassword: true,
    });

    await NotificationSetting.create({ userId: mentor._id });

    setImmediate(() => sendMentorCredentials({
      mentorName:  `${firstName} ${lastName}`,
      mentorEmail: email,
      login,
      tempPassword,
      frontendUrl: process.env.MENTOR_FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:4201',
    }).catch(() => {}));

    res.status(201).json({ ...mentor.toObject(), password: undefined });
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(400).json({ message: 'Email ou login déjà utilisé' });
      return;
    }
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};
