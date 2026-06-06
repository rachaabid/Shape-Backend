import { Request } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import NotificationSetting from '../models/NotificationSetting';
import { signToken } from '../config/jwt';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { HttpError }    from '../utils/HttpError';
import { triggerMatchForNewCandidate } from '../services/autoMatch.service';
import { sendAccountValidationEmail, sendAccountRejectionEmail, sendPasswordResetEmail } from '../services/email.service';
import { notifyAdmins } from './notification.controller';

const USER_SKILLS_POPULATE = [
  { path: 'candidateProfile.hardSkills.skill', select: '_id name' },
  { path: 'candidateProfile.softwares.skill',  select: '_id name' },
  { path: 'candidateProfile.softSkills.skill', select: '_id name' },
];

const BCRYPT_ROUNDS = 10;
const NEEDS_ADMIN_VALIDATION = new Set(['CANDIDATE', 'COMPANY']);

const normalizeSkillArray = (arr: any[]): { skill: string; level: number }[] =>
  (arr || []).map(item => ({
    skill: item.skill?._id ?? item.skill,
    level: item.level,
  }));

/** Construit un patch utilisateur en hashant le mot de passe et en
 *  normalisant les compétences ; lève HttpError si l'email est déjà pris. */
async function buildUserUpdate(
  body: Record<string, any>,
  targetUserId: string | undefined,
): Promise<Record<string, unknown>> {
  const { password, email: rawEmail, ...rest } = body;
  const updates: Record<string, unknown> = { ...rest };

  if (rawEmail) {
    const email = rawEmail.toLowerCase().trim();
    if (await User.findOne({ email, _id: { $ne: targetUserId } })) {
      throw HttpError.badRequest('Email déjà utilisé');
    }
    updates['email'] = email;
  }
  if (password) updates['password'] = await bcrypt.hash(password, BCRYPT_ROUNDS);
  // Les compétences sont désormais portées par candidateProfile (sous-document).
  const cp = updates['candidateProfile'] as any;
  if (cp && typeof cp === 'object') {
    if (cp.hardSkills) cp.hardSkills = normalizeSkillArray(cp.hardSkills);
    if (cp.softwares)  cp.softwares  = normalizeSkillArray(cp.softwares);
    if (cp.softSkills && Array.isArray(cp.softSkills) && typeof cp.softSkills[0] === 'object') {
      cp.softSkills = normalizeSkillArray(cp.softSkills);
    }
  }
  return updates;
}

// POST /api/User/Authenticate
export const authenticate = asyncHandler(async (req: Request, res) => {
  const { email, password, login } = req.body;
  const identifier = login || email;
  const user = await User.findOne({
    $or: [{ login: identifier }, { email: identifier }],
    deleted: false,
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw HttpError.unauthorized('Identifiants invalides');
  }

  const needsAdminValidation = user.roles.some((r: string) => NEEDS_ADMIN_VALIDATION.has(r));
  if (needsAdminValidation && !user.verifiedAccount) {
    throw HttpError.forbidden('Compte en attente de validation par un administrateur');
  }

  const token = signToken(user._id.toString(), user.roles);
  await user.populate(USER_SKILLS_POPULATE);
  res.json({ ...user.toObject(), password: undefined, token });
});

// POST /api/User
export const createUser = asyncHandler(async (req: Request, res) => {
  const { email: rawEmail, login, password, roles, companyName } = req.body;
  const email = rawEmail?.toLowerCase().trim();

  if (await User.findOne({ $or: [{ email }, { login }] })) {
    throw HttpError.badRequest('Email ou login déjà utilisé');
  }

  const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user   = await User.create({ ...req.body, email, password: hashed, verifiedAccount: false });

  if (roles?.includes('COMPANY')) {
    user.companyProfile = { ...(user.companyProfile || {}), companyName: { fr: companyName || login } };
    await user.save();
  }
  await NotificationSetting.create({ userId: user._id });

  const token = signToken(user._id.toString(), user.roles);
  res.status(201).json({ ...user.toObject(), password: undefined, token });

  const userRoles = user.roles || [];
  if (userRoles.includes('COMPANY') || userRoles.includes('CANDIDATE')) {
    const roleLabel = userRoles.includes('COMPANY') ? 'entreprise' : 'candidat';
    setImmediate(() => notifyAdmins(
      'NEW_REGISTRATION',
      `Nouvelle inscription ${roleLabel} : ${user.email}`,
      { userId: user._id.toString(), role: roleLabel },
    ).catch(() => undefined));
  }
  if (userRoles.includes('CANDIDATE')) {
    setImmediate(() => triggerMatchForNewCandidate(user._id.toString()));
  }
});

// GET /api/User/:id
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params['id']).select('-password').populate(USER_SKILLS_POPULATE);
  if (!user) throw HttpError.notFound('Utilisateur non trouvé');
  res.json(user);
});

// PUT /api/User
export const updateUser = asyncHandler<AuthRequest>(async (req, res) => {
  const updates = await buildUserUpdate(req.body, req.userId);
  res.json(
    await User.findByIdAndUpdate(req.userId, updates, { new: true })
      .select('-password')
      .populate(USER_SKILLS_POPULATE),
  );
});

// PATCH /api/User
export const patchUser = asyncHandler<AuthRequest>(async (req, res) => {
  const { id, ...rest } = req.body;
  const targetId = id || req.userId;
  const updates = await buildUserUpdate(rest, targetId);
  res.json(
    await User.findByIdAndUpdate(targetId, updates, { new: true })
      .select('-password')
      .populate(USER_SKILLS_POPULATE),
  );
});

// DELETE /api/User/:id
export const deleteUser = asyncHandler<AuthRequest>(async (req, res) => {
  await User.findByIdAndDelete(req.params['id']);
  res.json({ message: 'Utilisateur supprimé' });
});

// GET /api/User/ResetPassword/:email
// Envoie un code de verification a 4 chiffres a l'utilisateur par email.
// Le code est stocke sur user.verificationCode et verifie ensuite par
// /authenticaterecovery/:email/:code. Le mot de passe actuel n'est PAS touche.
export const resetPassword = asyncHandler(async (req, res) => {
  const email = req.params['email']?.toLowerCase().trim();
  const user  = await User.findOne({ email });
  if (!user) throw HttpError.notFound('Email non trouvé');

  // Code a 4 chiffres pour matcher le formulaire (4 inputs numeriques).
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  await User.findByIdAndUpdate(user._id, { verificationCode: code });

  const name = (user as any).firstNameDisplay || user.login || user.email;
  setImmediate(() =>
    sendPasswordResetEmail({ userEmail: user.email, userName: name, code })
      .catch(err => console.error(`❌ Échec envoi reset password à ${user.email}:`, err?.message || err)),
  );

  res.json({ message: 'Email de récupération envoyé' });
});

// GET /api/User
export const getAllUsers = asyncHandler(async (_req, res) =>
  res.json(await User.find({ deleted: { $ne: true }, archived: { $ne: true } }).select('-password')));

// GET /api/User/archived
export const getArchivedUsers = asyncHandler(async (_req, res) =>
  res.json(
    await User.find({ deleted: { $ne: true }, archived: true })
      .select('-password').sort({ updatedAt: -1 }),
  ));

// PATCH /api/User/:id/archive
export const archiveUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params['id'], { archived: true }, { new: true },
  ).select('-password');
  if (!user) throw HttpError.notFound('Utilisateur non trouvé');
  res.json(user);
});

// PATCH /api/User/:id/unarchive
export const unarchiveUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params['id'], { archived: false }, { new: true },
  ).select('-password');
  if (!user) throw HttpError.notFound('Utilisateur non trouvé');
  res.json(user);
});

// GET /api/User/candidates
export const getCandidateUsers = asyncHandler(async (_req, res) =>
  res.json(await User.find({ roles: 'CANDIDATE', deleted: false }).select('-password')));

// PATCH /api/User/:id/validate
export const validateUserAccount = asyncHandler<AuthRequest>(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params['id'], { verifiedAccount: true }, { new: true },
  ).select('-password');
  if (!user) throw HttpError.notFound('Utilisateur non trouvé');

  const name = (user as any).firstNameDisplay || user.login || user.email;
  const frontendUrl = process.env['FRONTEND_URL'] || '';
  const role = user.roles?.includes('COMPANY') ? 'COMPANY' : 'CANDIDATE';
  setImmediate(() =>
    sendAccountValidationEmail({ userEmail: user.email, userName: name, frontendUrl, role })
      .catch(err => console.error(`❌ Échec envoi validation à ${user.email}:`, err?.message || err)),
  );
  res.json(user);
});

// PATCH /api/User/:id/reject
// Refuse une inscription COMPANY/CANDIDATE : envoie un email puis supprime
// l'utilisateur. L'email est envoyé AVANT la suppression pour pouvoir lire
// l'adresse + le rôle ; en cas d'échec d'envoi, on supprime quand même
// (l'admin garde la main sur la décision).
export const rejectUserAccount = asyncHandler<AuthRequest>(async (req, res) => {
  const user = await User.findById(req.params['id']);
  if (!user) throw HttpError.notFound('Utilisateur non trouvé');

  const email = user.email;
  const name  = (user as any).firstNameDisplay || user.login || email;
  const role  = user.roles?.includes('COMPANY') ? 'COMPANY' : 'CANDIDATE';
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : undefined;
  const frontendUrl = process.env['FRONTEND_URL'] || '';

  await User.findByIdAndDelete(user._id);

  setImmediate(() =>
    sendAccountRejectionEmail({ userEmail: email, userName: name, frontendUrl, role, reason })
      .catch(err => console.error(`❌ Échec envoi refus à ${email}:`, err?.message || err)),
  );

  res.json({ message: 'Inscription refusée', email });
});

// GET /api/User/authenticaterecovery/:email/:code
export const authenticateRecovery = asyncHandler(async (req, res) => {
  const { email, code } = req.params;
  const user = await User.findOne({ email, verificationCode: code });
  if (!user) throw HttpError.badRequest('Code invalide ou expiré');

  await User.findByIdAndUpdate(user._id, { verifiedAccount: true, verificationCode: undefined });
  const token = signToken(user._id.toString(), user.roles);
  res.json({ ...user.toObject(), password: undefined, token });
});
