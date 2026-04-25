import jwt from 'jsonwebtoken';

export const jwtConfig = {
  secret:    process.env.JWT_SECRET     || 'shape_secret',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

// Fonction partagée pour créer un token JWT — utilisée dans auth et user controllers
export const signToken = (id: string, roles: string[]): string =>
  jwt.sign({ id, roles }, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn } as jwt.SignOptions);
