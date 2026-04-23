import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import Company from '../models/Company';
import { runAutoMatchPipeline } from '../services/autoMatch.service';
import NotificationSetting from '../models/NotificationSetting';
import { jwtConfig } from '../config/jwt';
import { AuthRequest } from '../middleware/auth.middleware';

const signToken = (id: string, roles: string[]) =>
  jwt.sign({ id, roles }, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn } as jwt.SignOptions);

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

    const token = signToken(user._id.toString(), user.roles);
    res.json({ ...user.toObject(), password: undefined, token });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// POST /api/User
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, login, password, roles, companyName } = req.body;

    if (await User.findOne({ $or: [{ email }, { login }] })) {
      res.status(400).json({ message: 'Email ou login déjà utilisé' });
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    const user   = await User.create({ ...req.body, password: hashed, verifiedAccount: false });

    // auto-create company profile for COMPANY role
    if (roles?.includes('COMPANY')) {
      await Company.create({ name: { fr: companyName || login }, owner: user._id });
    }
    // auto-create notification settings
    await NotificationSetting.create({ userId: user._id });

    const token = signToken(user._id.toString(), user.roles);
    res.status(201).json({ ...user.toObject(), password: undefined, token });

    // Si c'est un candidat → déclencher le matching contre toutes les offres ouvertes
    if (user.roles.includes('CANDIDATE')) {
      setImmediate(() => runAutoMatchPipeline({ candidateId: user._id.toString() }));
    }
  } catch (err) {
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
    const { password, ...rest } = req.body;
    const updates: Record<string, unknown> = { ...rest };
    if (password) updates.password = await bcrypt.hash(password, 10);

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// PATCH /api/User  (partial update with id in body)
export const patchUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, password, ...rest } = req.body;
    const targetId = id || req.userId;
    const updates: Record<string, unknown> = { ...rest };
    if (password) updates.password = await bcrypt.hash(password, 10);

    const user = await User.findByIdAndUpdate(targetId, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// DELETE /api/User/:id
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await User.findByIdAndUpdate(req.params.id, { deleted: true });
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
