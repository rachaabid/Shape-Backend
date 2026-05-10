import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User';
import Company from '../models/Company';
import NotificationSetting from '../models/NotificationSetting';
import { signToken } from '../config/jwt';
import { AuthRequest } from '../middleware/auth.middleware';
import { triggerMatchForNewCandidate } from '../services/autoMatch.service';
import { sendAccountValidationEmail } from '../services/email.service';
import { notifyAdmins } from './notification.controller';

// POST /api/User/Authenticate
export const authenticate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, login } = req.body;
    const identifier = login || email;
    const user = await User.findOne({
      $or: [{ login: identifier }, { email: identifier }],
      deleted: false,
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: 'Identifiants invalides' });
      return;
    }

    const needsAdminValidation = user.roles.some(r => r === 'CANDIDATE' || r === 'COMPANY');
    if (needsAdminValidation && !user.verifiedAccount) {
      res.status(403).json({ message: 'Compte en attente de validation par un administrateur' });
      return;
    }

    const token = signToken(user._id.toString(), user.roles);
    res.json({ ...user.toObject(), password: undefined, token });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// POST /api/User
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email: rawEmail, login, password, roles, companyName } = req.body;
    const email = rawEmail?.toLowerCase().trim();

    if (await User.findOne({ $or: [{ email }, { login }] })) {
      res.status(400).json({ message: 'Email ou login déjà utilisé' });
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    const user   = await User.create({ ...req.body, email, password: hashed, verifiedAccount: false });

    // auto-create company profile for COMPANY role
    if (roles?.includes('COMPANY')) {
      await Company.create({ name: { fr: companyName || login }, owner: user._id });
    }
    // auto-create notification settings
    await NotificationSetting.create({ userId: user._id });

    const token = signToken(user._id.toString(), user.roles);
    res.status(201).json({ ...user.toObject(), password: undefined, token });

    const roleLabel = (user.roles || []).includes('COMPANY') ? 'entreprise' : 'candidat';
    if ((user.roles || []).includes('COMPANY') || (user.roles || []).includes('CANDIDATE')) {
      setImmediate(() => notifyAdmins(
        'NEW_REGISTRATION',
        `Nouvelle inscription ${roleLabel} : ${user.email}`,
        { userId: user._id.toString(), role: roleLabel }
      ).catch(() => {}));
    }

    // trigger AI matching against all open offers for new candidates
    if ((user.roles || []).includes('CANDIDATE')) {
      setImmediate(() => triggerMatchForNewCandidate(user._id.toString()));
    }

  } catch (err: any) {
    if (err.code === 11000) {
      res.status(400).json({ message: 'Email ou login déjà utilisé' });
      return;
    }
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// GET /api/User/:id
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) { res.status(404).json({ message: 'Utilisateur non trouvé' }); return; }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// PUT /api/User  (full update)
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { password, email: rawEmail, ...rest } = req.body;
    const updates: Record<string, unknown> = { ...rest };

    if (rawEmail) {
      const email = rawEmail.toLowerCase().trim();
      if (await User.findOne({ email, _id: { $ne: req.userId } })) {
        res.status(400).json({ message: 'Email déjà utilisé' });
        return;
      }
      updates.email = email;
    }
    if (password) updates.password = await bcrypt.hash(password, 10);

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(400).json({ message: 'Email ou login déjà utilisé' });
      return;
    }
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// PATCH /api/User  (partial update with id in body)
export const patchUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, password, email: rawEmail, ...rest } = req.body;
    const targetId = id || req.userId;
    const updates: Record<string, unknown> = { ...rest };

    if (rawEmail) {
      const email = rawEmail.toLowerCase().trim();
      if (await User.findOne({ email, _id: { $ne: targetId } })) {
        res.status(400).json({ message: 'Email déjà utilisé' });
        return;
      }
      updates.email = email;
    }
    if (password) updates.password = await bcrypt.hash(password, 10);

    const user = await User.findByIdAndUpdate(targetId, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(400).json({ message: 'Email ou login déjà utilisé' });
      return;
    }
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// DELETE /api/User/:id
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// GET /api/User/ResetPassword/:email
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) { res.status(404).json({ message: 'Email non trouvé' }); return; }

    const tempPass = crypto.randomBytes(4).toString('hex');
    const hashed   = await bcrypt.hash(tempPass, 10);
    await User.findByIdAndUpdate(user._id, { password: hashed });

    res.json({ message: 'Mot de passe temporaire généré', tempPassword: tempPass });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// GET /api/User  → tous les utilisateurs (admin)
export const getAllUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find({ deleted: false }).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// GET /api/User/candidates
export const getCandidateUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find({ roles: 'CANDIDATE', deleted: false }).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// PATCH /api/User/:id/validate  (admin validates a COMPANY or CANDIDATE account)
export const validateUserAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { verifiedAccount: true },
      { new: true }
    ).select('-password');

    if (!user) { res.status(404).json({ message: 'Utilisateur non trouvé' }); return; }

    const name = (user as any).firstNameDisplay || user.login || user.email;
    const frontendUrl = process.env.FRONTEND_URL || '';
    setImmediate(() =>
      sendAccountValidationEmail({ userEmail: user.email, userName: name, frontendUrl }).catch(() => {})
    );

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// GET /api/User/authenticaterecovery/:email/:code
export const authenticateRecovery = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code } = req.params;
    const user = await User.findOne({ email, verificationCode: code });
    if (!user) { res.status(400).json({ message: 'Code invalide ou expiré' }); return; }

    await User.findByIdAndUpdate(user._id, { verifiedAccount: true, verificationCode: undefined });
    const token = signToken(user._id.toString(), user.roles);
    res.json({ ...user.toObject(), password: undefined, token });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};
