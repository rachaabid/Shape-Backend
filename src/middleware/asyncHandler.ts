import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Élimine le try/catch dans chaque contrôleur :
 *   export const getAll = asyncHandler(async (req, res) => { ... });
 *
 * Toute promesse rejetée est transférée à `next(err)`, donc capturée par le
 * `errorHandler` central. Le contrôleur ne s'occupe que du chemin nominal.
 *
 * Le générique sur `Request` permet de garder le typage des sous-types
 * (ex. AuthRequest) sans cast.
 */
type AsyncFn<TReq extends Request> = (
  req: TReq, res: Response, next: NextFunction,
) => Promise<unknown>;

export function asyncHandler<TReq extends Request = Request>(
  fn: AsyncFn<TReq>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req as TReq, res, next)).catch(next);
  };
}
