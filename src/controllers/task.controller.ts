import Task from '../models/Task';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { HttpError }    from '../utils/HttpError';
import { createNotification } from './notification.controller';

// ── Helpers (modèle Task unifié : réponses imbriquées) ───────────────────────

/** Tâche « énoncé » sans le tableau responses (pour l'imbriquer dans response.task). */
function taskPlain(t: any) {
  const o = t?.toObject ? t.toObject() : t;
  if (!o) return o;
  const { responses, ...rest } = o;
  return rest;
}

/** Convertit un sous-document réponse vers la forme historique de TaskResponse
 *  (pour préserver le contrat d'API consommé par les fronts). */
function mapResponse(task: any, r: any, opts: { populateTask?: boolean; ownerMap?: Map<string, any> } = {}) {
  const rr = r?.toObject ? r.toObject() : r;
  return {
    ...rr,
    id:      rr._id,
    task:    opts.populateTask ? taskPlain(task) : task._id,
    owner:   opts.ownerMap ? (opts.ownerMap.get(String(rr.owner)) ?? rr.owner) : rr.owner,
    comments: (rr.comments || []).filter((c: any) => !c.deleted),
  };
}

/** Récupère les utilisateurs (owners) pour peupler le champ owner des réponses. */
async function ownerMapFor(responses: any[]) {
  const ids = [...new Set(responses.map(r => String(r.owner)).filter(v => v && v !== 'undefined'))];
  const map = new Map<string, any>();
  if (!ids.length) return map;
  const users = await User.find({ _id: { $in: ids } }).select('-password').lean();
  users.forEach((u: any) => map.set(String(u._id), u));
  return map;
}

/** Itère sur toutes les réponses non supprimées de toutes les tâches. */
async function allResponses(): Promise<{ task: any; r: any }[]> {
  const tasks = await Task.find({ deleted: { $ne: true } });
  const out: { task: any; r: any }[] = [];
  tasks.forEach(t => (t.responses || []).forEach(r => { if (!(r as any).deleted) out.push({ task: t, r }); }));
  return out;
}

// ── Task (énoncé) ────────────────────────────────────────────────────────────

export const getTasks = asyncHandler(async (_req, res) => {
  res.json(await Task.find({ deleted: { $ne: true } }));
});

export const getMineTasks = asyncHandler<AuthRequest>(async (req, res) => {
  res.json(await Task.find({ createdBy: req.userId, deleted: { $ne: true } }));
});

export const getMineTaskResponses = asyncHandler<AuthRequest>(async (req, res) => {
  const tasks = await Task.find({ createdBy: req.userId, deleted: { $ne: true } });
  const pairs: { task: any; r: any }[] = [];
  tasks.forEach(t => (t.responses || []).forEach(r => { if (!(r as any).deleted) pairs.push({ task: t, r }); }));
  const ownerMap = await ownerMapFor(pairs.map(p => p.r));
  res.json(pairs.map(p => mapResponse(p.task, p.r, { populateTask: true, ownerMap })));
});

export const getTaskCount = asyncHandler(async (_req, res) => {
  res.json(await Task.countDocuments({ deleted: { $ne: true } }));
});

export const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params['id']);
  if (!task) throw HttpError.notFound('Tâche non trouvée');
  res.json(task);
});

export const getTaskByAttribute = asyncHandler(async (req, res) => {
  const { attributeName, value } = req.params;
  const tasks = await Task.find({ [attributeName]: value, deleted: { $ne: true } });
  res.json(tasks);
});

export const createTask = asyncHandler<AuthRequest>(async (req, res) => {
  res.status(201).json(await Task.create(req.body));
});

export const updateTask = asyncHandler<AuthRequest>(async (req, res) => {
  const { id, responses, ...rest } = req.body;     // on ne remplace pas les réponses ici
  res.json(await Task.findByIdAndUpdate(id, rest, { new: true }));
});

export const patchTask = asyncHandler<AuthRequest>(async (req, res) => {
  const { id, responses, ...rest } = req.body;
  res.json(await Task.findByIdAndUpdate(id, rest, { new: true }));
});

// ── TaskResponse (réponses imbriquées — API préservée) ───────────────────────

export const getTaskResponses = asyncHandler(async (_req, res) => {
  const pairs = await allResponses();
  res.json(pairs.map(p => mapResponse(p.task, p.r)));
});

export const getTaskResponseById = asyncHandler(async (req, res) => {
  const id = req.params['id'];
  const task = await Task.findOne({ 'responses._id': id });
  const r = task && (task.responses as any).id(id);
  if (!task || !r) throw HttpError.notFound();
  const ownerMap = await ownerMapFor([r]);
  res.json(mapResponse(task, r, { populateTask: true, ownerMap }));
});

export const getTaskResponseByAttribute = asyncHandler(async (req, res) => {
  const value = req.params['value'];
  const attr  = req.params['attributeName'].toLowerCase();
  let pairs: { task: any; r: any }[] = [];

  if (attr === 'task') {
    const t = await Task.findById(value);
    if (t) (t.responses || []).forEach(r => { if (!(r as any).deleted) pairs.push({ task: t, r }); });
  } else {
    const all = await allResponses();
    pairs = all.filter(({ r }) =>
      (attr === 'inscription' && String(r.inscription) === String(value)) ||
      (attr === 'status'      && r.status === Number(value)),
    );
  }
  const ownerMap = await ownerMapFor(pairs.map(p => p.r));
  res.json(pairs.map(p => mapResponse(p.task, p.r, { populateTask: true, ownerMap })));
});

export const getTaskResponseCountByAttribute = asyncHandler(async (req, res) => {
  const { attributeName, value } = req.params;
  const all = await allResponses();
  const count = all.filter(({ r }) =>
    attributeName === 'status'
      ? r.status === Number(value)
      : String((r as any)[attributeName]) === String(value),
  ).length;
  res.json(count);
});

export const createTaskResponse = asyncHandler<AuthRequest>(async (req, res) => {
  const { task, id, ...rest } = req.body;
  const t = await Task.findById(task);
  if (!t) throw HttpError.notFound('Tâche non trouvée');
  t.responses = t.responses || [];
  (t.responses as any).push({ ...rest, owner: rest.owner || req.userId });
  await t.save();
  const created = t.responses[t.responses.length - 1];
  res.status(201).json(mapResponse(t, created, { populateTask: true }));
});

export const updateTaskResponse = asyncHandler<AuthRequest>(async (req, res) => {
  const { id, task, ...rest } = req.body;
  const t = await Task.findOne({ 'responses._id': id });
  const r = t && (t.responses as any).id(id);
  if (!t || !r) throw HttpError.notFound();
  ['status', 'files', 'inscription', 'owner', 'deleted'].forEach(k => {
    if (rest[k] !== undefined) (r as any)[k] = rest[k];
  });
  await t.save();
  res.json(mapResponse(t, r, { populateTask: true }));
});

export const patchTaskResponse = asyncHandler<AuthRequest>(async (req, res) => {
  const { id, status } = req.body;
  const t = await Task.findOne({ 'responses._id': id });
  const r = t && (t.responses as any).id(id);
  if (!t || !r) throw HttpError.notFound();
  (r as any).status = status;
  await t.save();
  res.json(mapResponse(t, r, { populateTask: true }));

  if (status === 2 && t.createdBy) {
    const title = (t.title as any)?.fr || (t.title as any)?.en || String(t.title || 'Sans titre');
    setImmediate(() => createNotification(
      String(t.createdBy),
      'TASK_IN_REVIEW',
      `Un candidat a soumis une réponse en révision pour la tâche « ${title} ».`,
      { taskId: String(t._id), responseId: String(id), taskTitle: title },
    ).catch(() => undefined));
  }
});

export const addFileToTaskResponse = asyncHandler<AuthRequest>(async (req, res) => {
  const { name, url } = req.body;
  const t = await Task.findOne({ 'responses._id': req.params['id'] });
  const r = t && (t.responses as any).id(req.params['id']);
  if (!t || !r) throw HttpError.notFound('Réponse non trouvée');
  (r as any).files = (r as any).files || [];
  (r as any).files.push({ name, url });
  await t.save();
  const ownerMap = await ownerMapFor([r]);
  res.json(mapResponse(t, r, { populateTask: true, ownerMap }));

  if (t.createdBy) {
    const title = (t.title as any)?.fr || (t.title as any)?.en || String(t.title || 'Sans titre');
    setImmediate(() => createNotification(
      String(t.createdBy),
      'TASK_FILE_UPLOADED',
      `Un candidat a déposé un fichier sur la tâche « ${title} ».`,
      { taskId: String(t._id), responseId: String(req.params['id']), taskTitle: title },
    ).catch(() => undefined));
  }
});

export const removeFileFromTaskResponse = asyncHandler<AuthRequest>(async (req, res) => {
  const fileIndex = parseInt(req.params['fileIndex'], 10);
  const t = await Task.findOne({ 'responses._id': req.params['id'] });
  const r = t && (t.responses as any).id(req.params['id']);
  if (!t || !r) throw HttpError.notFound('Réponse non trouvée');
  if ((r as any).files && fileIndex >= 0 && fileIndex < (r as any).files.length) {
    (r as any).files.splice(fileIndex, 1);
    await t.save();
  }
  res.json(mapResponse(t, r, { populateTask: true }));
});
