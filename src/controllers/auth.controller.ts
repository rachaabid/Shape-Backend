import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Company from '../models/Company';
import { jwtConfig } from '../config/jwt';

const signToken = (id: string, roles: string[]) =>
  jwt.sign({ id, roles }, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn } as jwt.SignOptions);

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { login, email, password, roles, companyName } = req.body;

    if (await User.findOne({ $or: [{ email }, { login }] })) {
      res.status(400).json({ message: 'Email ou login déjà utilisé' });
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    const user   = await User.create({ login, email, password: hashed, roles: roles || ['COMPANY'] });

    if (roles?.includes('COMPANY') && companyName) {
      await Company.create({ userId: user._id, name: companyName });
    }

    const token = signToken(user._id.toString(), user.roles);
    res.status(201).json({ token, user: { id: user._id, login, email, roles: user.roles } });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: 'Identifiants invalides' });
      return;
    }

    const token = signToken(user._id.toString(), user.roles);
    res.json({ token, user: { id: user._id, login: user.login, email, roles: user.roles } });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

export const getProfile = async (req: Request & { userId?: string }, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) { res.status(404).json({ message: 'Utilisateur non trouvé' }); return; }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

export const updateProfile = async (req: Request & { userId?: string }, res: Response): Promise<void> => {
  try {
    const updates = req.body;
    if (updates.password) updates.password = await bcrypt.hash(updates.password, 10);
    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};
