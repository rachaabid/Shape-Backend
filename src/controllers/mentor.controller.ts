import bcrypt   from 'bcryptjs';
import crypto   from 'crypto';
import mongoose from 'mongoose';
import User         from '../models/User';
import Inscription  from '../models/Inscription';
import Task         from '../models/Task';
import MentorEvaluation   from '../models/MentorEvaluation';
import Interview          from '../models/Interview';
import NotificationSetting from '../models/NotificationSetting';
import Quiz from '../models/Quiz';
import Message      from '../models/Message';
import { AuthRequest }  from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { HttpError }    from '../utils/HttpError';
import { sendMentorCredentials } from '../services/email.service';
import { notifyAdmins, createNotification } from './notification.controller';

const BCRYPT_ROUNDS = 10;
const clamp = (v: number) => Math.max(0, Math.min(10, Math.round(v)));

// ── Mentor : stagiaires assignés ─────────────────────────────────────────────
export const getMyInterns = asyncHandler<AuthRequest>(async (req, res) => {
  res.json(
    await Inscription.find({ mentor: req.userId, deleted: { $ne: true } })
      .populate('user', '-password')
      .populate('trainings', 'title duration deleted'),
  );
});

// ── Mentor stats ──────────────────────────────────────────────────────────────
export const getMentorStats = asyncHandler<AuthRequest>(async (req, res) => {
  const myInscriptions = await Inscription.find({ mentor: req.userId, deleted: { $ne: true } });
  const myInternIds    = myInscriptions.map(i => i.user);

  const [myTasks, myEvals, pendingReviews] = await Promise.all([
    Task.countDocuments({ createdBy: req.userId, deleted: { $ne: true } }),
    // Toutes les évaluations pour les interns de ce mentor (tous mentors confondus)
    // — aligné avec la page évaluations qui appelle getEvaluations(internId) sans filtre mentor
    MentorEvaluation.countDocuments({
      intern:  { $in: myInternIds },
      deleted: { $ne: true },
    }),
    // Réponses status=2 sur les tâches créées par CE mentor, soumises par SES interns
    // — aligné avec la page tasks qui filtre par isMyIntern(owner) sur getMentorTasks()
    // req.userId est une string JWT ; dans un pipeline d'agrégation le casting
    // Mongoose n'est pas automatique → il faut convertir en ObjectId explicitement.
    Task.aggregate([
      { $match: { createdBy: new mongoose.Types.ObjectId(req.userId!), deleted: { $ne: true } } },
      { $unwind: '$responses' },
      { $match: {
        'responses.deleted': { $ne: true },
        'responses.status':  2,
        'responses.owner':   { $in: myInternIds },
      }},
      { $count: 'total' },
    ]).then(r => r[0]?.total ?? 0),
  ]);

  res.json({ internCount: myInscriptions.length, taskCount: myTasks, evalCount: myEvals, pendingReviews });
});

// ── Évaluation assistée : suggestion de scores ───────────────────────────────
export const getEvaluationSuggestion = asyncHandler<AuthRequest>(async (req, res) => {
  const internId = req.params['internId'];

  const [taskResponses, quizResponses, intern, inscriptions, messagesSent] = await Promise.all([
    // réponses du stagiaire à plat (depuis Task.responses[])
    Task.find({ deleted: { $ne: true } }).then(tasks => {
      const out: any[] = [];
      tasks.forEach(t => (t.responses || []).forEach((r: any) => {
        if (!r.deleted && String(r.owner) === String(internId)) out.push(r);
      }));
      return out;
    }),
    // réponses quiz du stagiaire à plat (depuis Quiz.responses[])
    Quiz.find({ deleted: { $ne: true } }).then(quizzes => {
      const out: any[] = [];
      quizzes.forEach(q => (q.responses || []).forEach((r: any) => {
        if (!r.deleted && String(r.owner) === String(internId)) out.push(r);
      }));
      return out;
    }),
    User.findById(internId),
    Inscription.find({ user: internId, deleted: { $ne: true } }),
    Message.countDocuments({ sender: internId }),
  ]);

  // 1. Tâches terminées (status 3 = Closed)
  const tasksTotal = taskResponses.length;
  const tasksDone  = taskResponses.filter(t => t.status === 3).length;
  const tasksInProgress = taskResponses.filter(t => t.status === 1 || t.status === 2).length;
  const taskCompletion = tasksTotal ? Math.round((tasksDone / tasksTotal) * 100) : 0;

  // 2. Quiz : 5 quiz → 100 %
  const quizCount = quizResponses.length;
  const quizScore = Math.min(100, quizCount * 20);

  // 3. Maîtrise des compétences (moyenne des levels /5, en %)
  const internCp = (intern as any)?.candidateProfile || {};
  const skillLevels: number[] = [
    ...((internCp.hardSkills as any[]) || []).map(s => s.level || 0),
    ...((internCp.softwares  as any[]) || []).map(s => s.level || 0),
  ];
  const skillMastery = skillLevels.length
    ? Math.round((skillLevels.reduce((a, b) => a + b, 0) / skillLevels.length / 5) * 100)
    : 0;

  // 4. Avancement formation
  const inscriptionsCompleted = inscriptions.filter(i => i.status === 'completed').length;
  const formationProgress = inscriptions.length
    ? Math.round((inscriptionsCompleted / inscriptions.length) * 50 + (taskCompletion / 2))
    : taskCompletion;

  // 5. Communication : 30 messages → 100 %
  const communicationActivity = Math.min(100, Math.round((messagesSent / 30) * 100));

  // Scores suggérés /10 (formule pondérée transparente)
  const technical     = clamp((skillMastery * 0.5 + quizScore * 0.3 + taskCompletion * 0.2) / 10);
  const behavior      = clamp((taskCompletion * 0.7 + formationProgress * 0.3) / 10);
  const communication = clamp((communicationActivity * 0.7 + taskCompletion * 0.3) / 10);
  const initiative    = clamp(((taskCompletion + quizScore) / 2 * 0.6 + skillMastery * 0.4) / 10);
  const globalScore   = Math.round(((technical + behavior + communication + initiative) / 4) * 10) / 10;

  res.json({
    metrics: {
      taskCompletion, formationProgress, quizScore, skillMastery,
      communicationActivity, tasksDone, tasksTotal, tasksInProgress,
      quizCount, messagesSent,
    },
    suggested: { technical, behavior, communication, initiative, globalScore },
  });
});

// ── Réponses aux tâches d'un stagiaire ───────────────────────────────────────
export const getInternTaskResponses = asyncHandler(async (req, res) => {
  const internId = req.params['internId'];
  const tasks = await Task.find({ deleted: { $ne: true } });
  const pairs: { task: any; r: any }[] = [];
  tasks.forEach(t => (t.responses || []).forEach((r: any) => {
    if (!r.deleted && String(r.owner) === String(internId)) pairs.push({ task: t, r });
  }));
  const users = await User.find({ _id: internId }).select('-password').lean();
  const owner = users[0];
  res.json(pairs.map(({ task, r }) => {
    const rr = r.toObject ? r.toObject() : r;
    const { responses, ...taskPlain } = (task.toObject ? task.toObject() : task);
    return {
      ...rr, id: rr._id, task: taskPlain,
      owner: owner ?? rr.owner,
      comments: (rr.comments || []).filter((c: any) => !c.deleted),
    };
  }));
});

// ── Tâches créées par ce mentor ──────────────────────────────────────────────
export const getMentorTasks = asyncHandler<AuthRequest>(async (req, res) => {
  const tasks = await Task.find({ createdBy: req.userId, deleted: { $ne: true } }).lean();

  const ownerIds = [...new Set(
    tasks.flatMap(t => (t.responses || [])
      .filter((r: any) => !r.deleted && r.owner)
      .map((r: any) => String(r.owner))
    )
  )];

  const users = await User.find({ _id: { $in: ownerIds } })
    .select('firstName lastName firstNameDisplay lastNameDisplay login email')
    .lean();
  const userMap = new Map(users.map(u => [String(u._id), u]));

  const result = tasks.map(t => ({
    ...t,
    responses: (t.responses || []).map((r: any) => ({
      ...r,
      owner: userMap.get(String(r.owner)) ?? r.owner,
    })),
  }));

  res.json(result);
});

export const createMentorTask = asyncHandler<AuthRequest>(async (req, res) => {
  const { trainingId, internIds, ...taskData } = req.body;
  const task = await Task.create({
    ...taskData,
    training:   trainingId || undefined,
    createdBy: req.userId,
  });

  if (internIds?.length) {
    // Retrouver les inscriptions pour associer le TaskResponse à l'inscription du candidat
    // (permet au frontend de retrouver les tâches via GET /TaskResponse/ByAttribute/Inscription/{id})
    const inscriptions = trainingId
      ? await Inscription.find({
          user:     { $in: internIds },
          trainings: trainingId,
          deleted:  { $ne: true },
        }).select('_id user')
      : [];
    const inscriptionByUser = new Map(
      inscriptions.map(ins => [ins.user!.toString(), ins._id]),
    );

    task.responses = (internIds as string[]).map((uid: string) => ({
      owner:       uid,
      status:      0,
      inscription: inscriptionByUser.get(uid),
    })) as any;
    await task.save();
  }
  res.status(201).json(task);
  setImmediate(() => notifyAdmins(
    'MENTOR_TASK',
    `Un mentor a créé une nouvelle tâche : "${task.title || 'Sans titre'}"`,
    { taskId: task._id.toString(), mentorId: req.userId },
  ).catch(() => undefined));
});

// PUT /api/Mentor/tasks/:id — US20 : modifier titre / description / deadline / training
// Le mentor ne peut editer que ses propres taches (filtre `createdBy: req.userId`).
// `internIds` (optionnel) remplace les assignations en preservant les reponses
// deja en cours (status, fichiers, commentaires) des owners conserves.
export const updateMentorTask = asyncHandler<AuthRequest>(async (req, res) => {
  const id = req.params['id'];
  const { trainingId, internIds, ...taskData } = req.body;

  const task = await Task.findOne({ _id: id, createdBy: req.userId, deleted: { $ne: true } });
  if (!task) throw HttpError.notFound('Tâche introuvable');

  Object.assign(task, taskData);
  if (trainingId !== undefined) task.training = trainingId || undefined;

  if (Array.isArray(internIds)) {
    const wantedSet = new Set<string>(internIds.map(String));
    const existing  = (task.responses || []) as any[];
    // 1) On garde les reponses dont l'owner est toujours dans la liste choisie.
    const kept = existing.filter(r => wantedSet.has(String(r.owner)));
    // 2) On rattache (ou cree) une reponse pour chaque nouvel intern.
    const keptOwners = new Set(kept.map(r => String(r.owner)));
    const inscriptions = task.training
      ? await Inscription.find({
          user: { $in: internIds },
          trainings: task.training,
          deleted: { $ne: true },
        }).select('_id user')
      : [];
    const inscriptionByUser = new Map(inscriptions.map(ins => [ins.user!.toString(), ins._id]));
    const added = internIds
      .filter((uid: string) => !keptOwners.has(String(uid)))
      .map((uid: string) => ({
        owner:       uid,
        status:      0,
        inscription: inscriptionByUser.get(String(uid)),
      }));
    task.responses = [...kept, ...added] as any;
  }

  await task.save();
  res.json(task);
});

export const deleteMentorTask = asyncHandler<AuthRequest>(async (req, res) => {
  // US21 : suppression douce (preserve l'historique pour les candidats/admins).
  // Seul le createur peut supprimer sa tache.
  const task = await Task.findOneAndUpdate(
    { _id: req.params['id'], createdBy: req.userId },
    { deleted: true },
    { new: true },
  );
  if (!task) throw HttpError.notFound('Tâche introuvable');
  res.json({ message: 'Tâche supprimée' });
});

// ── Évaluations ──────────────────────────────────────────────────────────────
const computeGlobalScore = (t: number, b: number, c: number, i: number) =>
  Math.round(((t + b + c + i) / 4) * 10) / 10;

export const getEvaluations = asyncHandler(async (req, res) => {
  res.json(
    await MentorEvaluation.find({ intern: req.params['internId'], deleted: { $ne: true } })
      .populate('mentor', '-password')
      .sort({ createdAt: -1 }),
  );
});

export const getMyEvaluations = asyncHandler<AuthRequest>(async (req, res) => {
  res.json(
    await MentorEvaluation.find({ mentor: req.userId, deleted: { $ne: true } })
      .populate('intern', '-password')
      .sort({ createdAt: -1 }),
  );
});

// US24 — vue candidat : ses propres evaluations recues, classees recente -> ancienne.
export const getMyEvaluationsAsIntern = asyncHandler<AuthRequest>(async (req, res) => {
  res.json(
    await MentorEvaluation.find({ intern: req.userId, deleted: { $ne: true } })
      .populate('mentor', 'firstName lastName login email avatarStorage mentorProfile')
      .populate('inscription')
      .sort({ createdAt: -1 }),
  );
});

export const createEvaluation = asyncHandler<AuthRequest>(async (req, res) => {
  const { intern, inscription, period, technical, behavior, communication, initiative, comment } = req.body;
  const globalScore = computeGlobalScore(technical, behavior, communication, initiative);
  const ev = await MentorEvaluation.create({
    mentor: req.userId, intern, inscription, period,
    technical, behavior, communication, initiative, globalScore, comment,
  });
  res.status(201).json(ev);
  setImmediate(() => Promise.all([
    notifyAdmins(
      'MENTOR_EVALUATION',
      `Un mentor a soumis une évaluation (score global : ${ev.globalScore}/10)`,
      { evalId: ev._id.toString(), mentorId: req.userId },
    ),
    createNotification(
      String(intern),
      'EVALUATION_RECEIVED',
      `Vous avez reçu une nouvelle évaluation (${ev.globalScore}/10) pour la période « ${period} ».`,
      { evalId: ev._id.toString(), period, globalScore: ev.globalScore },
    ),
  ]).catch(() => undefined));
});

export const updateEvaluation = asyncHandler<AuthRequest>(async (req, res) => {
  const { id, technical, behavior, communication, initiative, ...rest } = req.body;
  const globalScore = computeGlobalScore(technical, behavior, communication, initiative);
  const updated = await MentorEvaluation.findByIdAndUpdate(
    id, { technical, behavior, communication, initiative, globalScore, ...rest },
    { new: true },
  );
  res.json(updated);
  if (updated?.intern) {
    setImmediate(() => createNotification(
      String(updated.intern),
      'EVALUATION_UPDATED',
      `Votre évaluation « ${updated.period} » a été mise à jour (${updated.globalScore}/10).`,
      { evalId: String(updated._id), period: updated.period, globalScore: updated.globalScore },
    ).catch(() => undefined));
  }
});

export const deleteEvaluation = asyncHandler<AuthRequest>(async (req, res) => {
  await MentorEvaluation.findByIdAndUpdate(req.params['id'], { deleted: true });
  res.json({ message: 'Évaluation supprimée' });
});

// ── Admin : assigner un mentor à une inscription ─────────────────────────────
export const assignMentor = asyncHandler<AuthRequest>(async (req, res) => {
  const { inscriptionId, mentorId } = req.body;
  res.json(
    await Inscription.findByIdAndUpdate(inscriptionId, { mentor: mentorId }, { new: true })
      .populate('user', '-password')
      .populate('mentor', '-password'),
  );
});

// ── Appointments (créneaux d'agenda mentor) ─────────────────────────────────
// Backed par Interview avec kind='appointment'. Le mapping conserve la forme
// historique date/startTime/endTime côté API pour ne pas casser le front.
// `date` = ISO YYYY-MM-DD, `startTime`/`endTime` = HH:MM.
function appointmentToLegacyShape(d: any): any {
  const start: Date | null = d.scheduledAt ? new Date(d.scheduledAt) : null;
  const end:   Date | null = d.endAt       ? new Date(d.endAt)       : null;
  const hh = (dt: Date) => `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
  return {
    _id:         d._id,
    mentor:      d.mentorId,
    intern:      d.candidateId ?? undefined,
    title:       d.title       ?? '',
    subtitle:    d.subtitle    ?? '',
    date:        start ? start.toISOString().slice(0, 10) : '',
    startTime:   start ? hh(start) : '',
    endTime:     end   ? hh(end)   : '',
    meetingLink: d.meetingLink ?? '',
    deleted:     d.deleted     ?? false,
  };
}

export const getAppointments = asyncHandler<AuthRequest>(async (req, res) => {
  const docs = await Interview.find({
    kind: 'appointment', mentorId: req.userId, deleted: { $ne: true },
  })
    .populate('candidateId', 'firstName lastName login email')
    .sort({ scheduledAt: 1 });
  res.json(docs.map(d => appointmentToLegacyShape({
    ...d.toObject(),
    candidateId: (d as any).candidateId, // garde l'objet peuplé
  })));
});

export const getMyAppointmentsAsIntern = asyncHandler<AuthRequest>(async (req, res) => {
  const docs = await Interview.find({
    kind: 'appointment', candidateId: req.userId, deleted: { $ne: true },
  })
    .populate('mentorId', 'firstName lastName login email')
    .sort({ scheduledAt: 1 });
  res.json(docs.map(d => {
    const obj = d.toObject() as any;
    return { ...appointmentToLegacyShape(obj), mentor: obj.mentorId };
  }));
});

export const createAppointment = asyncHandler<AuthRequest>(async (req, res) => {
  const { title, subtitle, date, startTime, endTime, internId, meetingLink } = req.body;
  if (!title || !date || !startTime || !endTime)
    throw HttpError.badRequest('Champs obligatoires : title, date, startTime, endTime');
  const scheduledAt = new Date(`${date}T${startTime}:00`);
  const endAt       = new Date(`${date}T${endTime}:00`);
  if (isNaN(scheduledAt.getTime()) || isNaN(endAt.getTime()))
    throw HttpError.badRequest('Format date/heure invalide (date: YYYY-MM-DD, time: HH:MM)');
  const appt = await Interview.create({
    kind: 'appointment',
    mentorId: req.userId,
    candidateId: internId || undefined,
    title, subtitle, scheduledAt, endAt, meetingLink,
  });
  res.status(201).json(appointmentToLegacyShape(appt.toObject()));
});

// ── Admin : liste de tous les mentors ────────────────────────────────────────
export const getMentors = asyncHandler(async (_req, res) =>
  res.json(await User.find({ roles: 'MENTOR', deleted: false }).select('-password')));

// ── Admin : création d'un compte mentor + envoi des identifiants ─────────────
export const createMentor = asyncHandler(async (req, res) => {
  const { email: rawEmail, firstName, lastName, expertise } = req.body;
  const email = rawEmail?.toLowerCase().trim();

  // Si un compte avec ce mail existe (actif ou supprimé), on nettoie ou refuse
  const existingByEmail = await User.findOne({ email });
  if (existingByEmail) {
    if (!existingByEmail.deleted) throw HttpError.badRequest('Email déjà utilisé par un compte actif.');
    await User.findByIdAndDelete(existingByEmail._id);
  }

  const tempPassword = crypto.randomBytes(4).toString('hex');
  const hashed       = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);
  const login        = email.split('@')[0] + '_mentor';

  const existingByLogin = await User.findOne({ login });
  if (existingByLogin) {
    if (!existingByLogin.deleted) throw HttpError.badRequest(`Le login "${login}" est déjà utilisé par un compte actif.`);
    await User.findByIdAndDelete(existingByLogin._id);
  }

  const mentor = await User.create({
    email, login, password: hashed,
    roles: ['MENTOR'],
    firstName: { fr: firstName, en: firstName },
    lastName:  { fr: lastName,  en: lastName  },
    verifiedAccount: true,
    mentorProfile: { expertise: expertise ? [expertise] : [] },
    mustChangePassword: true,
  });
  await NotificationSetting.create({ userId: mentor._id });

  setImmediate(() => sendMentorCredentials({
    mentorName:  `${firstName} ${lastName}`,
    mentorEmail: email,
    login,
    tempPassword,
    frontendUrl: process.env['MENTOR_FRONTEND_URL'] || process.env['FRONTEND_URL'] || 'http://localhost:4201',
  }).catch(err => console.error(`❌ Échec envoi identifiants mentor à ${email}:`, err?.message || err)));

  res.status(201).json({ ...mentor.toObject(), password: undefined });
});
