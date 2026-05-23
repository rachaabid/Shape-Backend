import Company from '../models/Company';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { HttpError }    from '../utils/HttpError';

// GET /api/Company/byattribute/owner/:userId
export const getByOwner = asyncHandler(async (req, res) => {
  const company = await Company.findOne({ owner: req.params['userId'], deleted: false });
  if (!company) throw HttpError.notFound('Entreprise non trouvée');
  res.json(company);
});

// GET /api/Company
export const getAll = asyncHandler(async (_req, res) =>
  res.json(await Company.find({ deleted: false })));

// GET /api/Company/:id
export const getById = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params['id']);
  if (!company) throw HttpError.notFound('Entreprise non trouvée');
  res.json(company);
});

// POST /api/Company
export const createCompany = asyncHandler<AuthRequest>(async (req, res) =>
  res.status(201).json(await Company.create({ ...req.body, owner: req.userId })));

// PUT /api/Company
export const updateCompany = asyncHandler<AuthRequest>(async (req, res) => {
  const { id, ...rest } = req.body;
  res.json(await Company.findByIdAndUpdate(id, rest, { new: true }));
});

// PATCH /api/Company
export const patchCompany = asyncHandler<AuthRequest>(async (req, res) => {
  const { id, ...rest } = req.body;
  res.json(await Company.findByIdAndUpdate(id, rest, { new: true }));
});

// DELETE /api/Company/:id
export const deleteCompany = asyncHandler<AuthRequest>(async (req, res) => {
  await Company.findByIdAndUpdate(req.params['id'], { deleted: true });
  res.json({ message: 'Entreprise supprimée' });
});
