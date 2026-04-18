import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';

export interface AuthRequest extends Request {
  userId?: string;
  userRoles?: string[];
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) { res.status(401).json({ message: 'Token manquant' }); return; }

  try {
    const decoded = jwt.verify(token, jwtConfig.secret) as { id: string; roles: string[] };
    req.userId    = decoded.id;
    req.userRoles = decoded.roles;
    next();
  } catch {
    res.status(401).json({ message: 'Token invalide' });
  }
};

export const requireRole = (role: string) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userRoles?.includes(role)) {
      res.status(403).json({ message: 'Accès refusé' });
      return;
    }
    next();
  };
