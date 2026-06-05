import Task from '../models/Task';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { HttpError }    from '../utils/HttpError';

/**
 * Commentaires de réponse : désormais imbriqués dans
 *   Task.responses[].comments[]
 * Le contrat d'API historique (/TaskResponseComment…) est préservé :
 *   un « commentaire » est renvoyé avec son champ `taskResponse` (= id de la réponse).
 */

function mapComment(taskResponseId: any, c: any, userMap?: Map<string, any>) {
  const cc = c?.toObject ? c.toObject() : c;
  return {
    ...cc,
    id:           cc._id,
    taskResponse: taskResponseId,
    user:         userMap ? (userMap.get(String(cc.user)) ?? cc.user) : cc.user,
  };
}

async function userMapFor(comments: any[]) {
  const ids = [...new Set(comments.map(c => String(c.user)).filter(v => v && v !== 'undefined'))];
  const map = new Map<string, any>();
  if (!ids.length) return map;
  const users = await User.find({ _id: { $in: ids } }).select('-password').lean();
  users.forEach((u: any) => map.set(String(u._id), u));
  return map;
}

/** Toutes les paires (réponse, commentaire) non supprimées, à plat. */
async function allComments(): Promise<{ respId: any; c: any }[]> {
  const tasks = await Task.find({ deleted: { $ne: true } });
  const out: { respId: any; c: any }[] = [];
  tasks.forEach(t => (t.responses || []).forEach(r =>
    (r.comments || []).forEach(c => { if (!(c as any).deleted) out.push({ respId: (r as any)._id, c }); })));
  return out;
}

export const countTaskResponseComments = asyncHandler(async (_req, res) => {
  res.json((await allComments()).length);
});

export const getTaskResponseCommentsByAttribute = asyncHandler(async (req, res) => {
  const { attributeName, value } = req.params;
  const start = parseInt(req.query['start'] as string) || 0;
  const count = parseInt(req.query['count'] as string) || 100;

  let pairs: { respId: any; c: any }[] = [];
  if (attributeName === 'taskResponse') {
    const t = await Task.findOne({ 'responses._id': value });
    const r = t && (t.responses as any).id(value);
    if (r) (r.comments || []).forEach((c: any) => { if (!c.deleted) pairs.push({ respId: r._id, c }); });
  } else {
    pairs = (await allComments()).filter(({ c }) => String((c as any)[attributeName]) === String(value));
  }
  const userMap = await userMapFor(pairs.map(p => p.c));
  res.json(pairs.slice(start, start + count).map(p => mapComment(p.respId, p.c, userMap)));
});

export const countTaskResponseCommentsByAttribute = asyncHandler(async (req, res) => {
  const { attributeName, value } = req.params;
  if (attributeName === 'taskResponse') {
    const t = await Task.findOne({ 'responses._id': value });
    const r = t && (t.responses as any).id(value);
    res.json(r ? (r.comments || []).filter((c: any) => !c.deleted).length : 0);
    return;
  }
  res.json((await allComments()).filter(({ c }) => String((c as any)[attributeName]) === String(value)).length);
});

export const getTaskResponseCommentById = asyncHandler(async (req, res) => {
  const id = req.params['id'];
  const tasks = await Task.find({ 'responses.comments._id': id });
  for (const t of tasks) {
    for (const r of (t.responses || [])) {
      const c = (r.comments || []).find((x: any) => String(x._id) === String(id));
      if (c) {
        const userMap = await userMapFor([c]);
        res.json(mapComment((r as any)._id, c, userMap));
        return;
      }
    }
  }
  throw HttpError.notFound();
});

export const getAllTaskResponseComments = asyncHandler(async (_req, res) => {
  const pairs = await allComments();
  const userMap = await userMapFor(pairs.map(p => p.c));
  res.json(pairs.map(p => mapComment(p.respId, p.c, userMap)));
});

export const createTaskResponseComment = asyncHandler<AuthRequest>(async (req, res) => {
  const { taskResponse, ...rest } = req.body;
  const t = await Task.findOne({ 'responses._id': taskResponse });
  const r = t && (t.responses as any).id(taskResponse);
  if (!t || !r) throw HttpError.notFound('Réponse non trouvée');
  r.comments = r.comments || [];
  r.comments.push({ ...rest, owner: rest.owner || req.userId, user: rest.user || req.userId });
  await t.save();
  const created = r.comments[r.comments.length - 1];
  const userMap = await userMapFor([created]);
  res.status(201).json(mapComment(r._id, created, userMap));
});

/** Retrouve un commentaire par son id à travers les tâches/réponses. */
async function findComment(id: string) {
  const t = await Task.findOne({ 'responses.comments._id': id });
  if (!t) return null;
  for (const r of (t.responses || [])) {
    const c = (r.comments || []).find((x: any) => String(x._id) === String(id));
    if (c) return { t, r, c };
  }
  return null;
}

export const updateTaskResponseComment = asyncHandler(async (req, res) => {
  const { id, taskResponse, ...rest } = req.body;
  const found = await findComment(id);
  if (!found) throw HttpError.notFound();
  ['message', 'user', 'owner', 'deleted'].forEach(k => { if (rest[k] !== undefined) (found.c as any)[k] = rest[k]; });
  await found.t.save();
  res.json(mapComment((found.r as any)._id, found.c));
});

export const patchTaskResponseComment = asyncHandler(async (req, res) => {
  const { id, taskResponse, ...rest } = req.body;
  const found = await findComment(id);
  if (!found) throw HttpError.notFound();
  Object.assign(found.c as any, rest);
  await found.t.save();
  res.json(mapComment((found.r as any)._id, found.c));
});

export const deleteTaskResponseComment = asyncHandler(async (req, res) => {
  const found = await findComment(req.params['id']);
  if (found) { (found.c as any).deleted = true; await found.t.save(); }
  res.json({ message: 'Supprimé' });
});
