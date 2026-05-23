/**
 * HTTP-aware error. Throwing it from a controller / service is the standard way
 * to surface 4xx situations — the central errorHandler converts it to a proper
 * JSON response. Anything thrown that is NOT an HttpError is treated as 500.
 *
 * Usage :
 *   if (!user) throw new HttpError(404, 'Utilisateur introuvable');
 *   if (!form.valid()) throw new HttpError(400, 'Payload invalide', { fields });
 */
export class HttpError extends Error {
  readonly status: number;
  readonly detail?: unknown;

  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.detail = detail;
  }

  static notFound(message = 'Ressource introuvable')   { return new HttpError(404, message); }
  static badRequest(message: string, detail?: unknown) { return new HttpError(400, message, detail); }
  static unauthorized(message = 'Non authentifié')     { return new HttpError(401, message); }
  static forbidden(message = 'Action non autorisée')   { return new HttpError(403, message); }
  static conflict(message: string)                     { return new HttpError(409, message); }
}
