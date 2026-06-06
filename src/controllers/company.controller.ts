import User from '../models/User';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { HttpError }    from '../utils/HttpError';

/**
 * La classe Company a été supprimée : une « entreprise » est désormais un User
 * portant le rôle COMPANY, avec ses données dans `companyProfile`.
 * Ce contrôleur conserve le contrat de l'API /Company en projetant le User
 * vers l'ancienne forme { _id, name, address, logo, owner } — où _id == user._id.
 */
const shape = (u: any) => {
  if (!u) return null;
  const cp = u.companyProfile || {};
  return {
    _id:         u._id,
    id:          u._id,
    name:        cp.companyName,
    companyName: cp.companyName,
    address:     cp.address,
    logo:       cp.logo,
    sector:     cp.sector,
    website:    cp.website,
    profession: cp.profession,
    owner:      u._id,
    deleted:    u.deleted,
    createdAt:  u.createdAt,
  };
};

/** Convertit le body { name, address, logo, ... } en patch dot-path companyProfile.* */
const toProfileSet = (body: Record<string, any>) => {
  const set: Record<string, any> = {};
  const name = body.name ?? body.companyName;
  if (name      !== undefined) set['companyProfile.companyName'] = name;
  if (body.address    !== undefined) set['companyProfile.address']    = body.address;
  if (body.logo       !== undefined) set['companyProfile.logo']       = body.logo;
  if (body.sector     !== undefined) set['companyProfile.sector']     = body.sector;
  if (body.website    !== undefined) set['companyProfile.website']    = body.website;
  if (body.profession !== undefined) set['companyProfile.profession'] = body.profession;
  return set;
};

// GET /api/Company/byattribute/owner/:userId
export const getByOwner = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params['userId'], roles: 'COMPANY', deleted: { $ne: true } });
  if (!user) throw HttpError.notFound('Entreprise non trouvée');
  res.json(shape(user));
});

// GET /api/Company
export const getAll = asyncHandler(async (_req, res) => {
  const users = await User.find({ roles: 'COMPANY', deleted: { $ne: true } });
  res.json(users.map(shape));
});

// GET /api/Company/:id
export const getById = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params['id'], roles: 'COMPANY' });
  if (!user) throw HttpError.notFound('Entreprise non trouvée');
  res.json(shape(user));
});

// POST /api/Company  — crée/complète le profil entreprise du user connecté
export const createCompany = asyncHandler<AuthRequest>(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.userId, { $set: toProfileSet(req.body) }, { new: true },
  );
  if (!user) throw HttpError.notFound('Utilisateur non trouvé');
  res.status(201).json(shape(user));
});

// PUT /api/Company
export const updateCompany = asyncHandler<AuthRequest>(async (req, res) => {
  const id = req.body.id || req.userId;
  const user = await User.findByIdAndUpdate(id, { $set: toProfileSet(req.body) }, { new: true });
  res.json(shape(user));
});

// PATCH /api/Company
export const patchCompany = asyncHandler<AuthRequest>(async (req, res) => {
  const id = req.body.id || req.userId;
  const user = await User.findByIdAndUpdate(id, { $set: toProfileSet(req.body) }, { new: true });
  res.json(shape(user));
});

// DELETE /api/Company/:id  — soft-delete du compte entreprise
export const deleteCompany = asyncHandler<AuthRequest>(async (req, res) => {
  await User.findByIdAndUpdate(req.params['id'], { deleted: true });
  res.json({ message: 'Entreprise supprimée' });
});
