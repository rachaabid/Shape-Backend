import { ErrorRequestHandler } from 'express';
import { HttpError } from '../utils/HttpError';

const isProduction = process.env['NODE_ENV'] === 'production';

/**
 * Middleware d'erreur centralisé — DOIT être enregistré APRÈS toutes les routes.
 *
 * - HttpError : utilise son status + son message (les 4xx sont sûrs à exposer).
 * - Mongoose CastError (ID invalide) → 400 avec un message clair.
 * - Mongoose ValidationError         → 400 + détail des champs.
 * - Mongoose DuplicateKey (E11000)   → 409.
 * - Reste                            → 500 avec message générique en prod,
 *                                       message + stack en dev.
 *
 * Conserve la forme `{ message, error?, detail? }` utilisée par les contrôleurs
 * historiques pour ne casser aucun client existant.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // 4xx connus
  if (err instanceof HttpError) {
    res.status(err.status).json({
      message: err.message,
      ...(err.detail !== undefined ? { detail: err.detail } : {}),
    });
    return;
  }

  // Mongoose : id mal formé
  if (err?.name === 'CastError' && err?.path === '_id') {
    res.status(400).json({ message: 'Identifiant invalide' });
    return;
  }

  // Mongoose : validation
  if (err?.name === 'ValidationError') {
    const fields = Object.fromEntries(
      Object.entries(err.errors ?? {}).map(([k, v]: [string, any]) => [k, v?.message]),
    );
    res.status(400).json({ message: 'Validation échouée', detail: fields });
    return;
  }

  // Mongoose : doublon (E11000)
  if (err?.code === 11000) {
    res.status(409).json({ message: 'Ressource déjà existante', detail: err.keyValue });
    return;
  }

  // Reste : 500
  // On garde la stack uniquement en dev pour éviter une fuite d'info en prod.
  console.error('[errorHandler]', err);
  res.status(500).json({
    message: 'Erreur serveur',
    ...(isProduction ? {} : { detail: err?.message ?? String(err) }),
  });
};
