import { Request, Response } from 'express';
import Company from '../models/Company';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /api/Company/byattribute/owner/:userId
export const getByOwner = async (req: Request, res: Response): Promise<void> => {
  try {
    const company = await Company.findOne({ owner: req.params.userId, deleted: false });
    if (!company) { res.status(404).json({ message: 'Entreprise non trouvée' }); return; }
    res.json(company);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// GET /api/Company/:id
export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) { res.status(404).json({ message: 'Entreprise non trouvée' }); return; }
    res.json(company);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// POST /api/Company
export const createCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const company = await Company.create({ ...req.body, owner: req.userId });
    res.status(201).json(company);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// PUT /api/Company
export const updateCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, ...rest } = req.body;
    const company = await Company.findByIdAndUpdate(id, rest, { new: true });
    res.json(company);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// PATCH /api/Company
export const patchCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, ...rest } = req.body;
    const company = await Company.findByIdAndUpdate(id, rest, { new: true });
    res.json(company);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};

// DELETE /api/Company/:id
export const deleteCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Company.findByIdAndUpdate(req.params.id, { deleted: true });
    res.json({ message: 'Entreprise supprimée' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};
