import Inscription from '../models/Inscription';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';

export const getMyMentor = asyncHandler<AuthRequest>(async (req, res) => {
  const inscription = await Inscription.findOne({ user: req.userId, deleted: false })
    .populate('mentor', '-password')
    .populate('user', '-password');
  res.json(inscription ?? null);
});

export const countInscriptions = asyncHandler(async (_req, res) =>
  res.json(await Inscription.countDocuments({ deleted: false })));

export const getInscriptionsByUser = asyncHandler(async (req, res) =>
  res.json(
    await Inscription.find({ user: req.params['userId'], deleted: false })
      .populate('user', '-password')
      .populate('trainings'),
  ));

export const getInscriptionsByMentor = asyncHandler(async (req, res) =>
  res.json(
    await Inscription.find({ mentor: req.params['mentorId'], deleted: false })
      .populate('user', '-password')
      .populate('trainings'),
  ));

export const getAllInscriptions = asyncHandler(async (_req, res) =>
  res.json(
    await Inscription.find({ deleted: false })
      .populate('user', '-password')
      .populate('trainings'),
  ));

export const createInscription = asyncHandler(async (req, res) =>
  res.status(201).json(await Inscription.create(req.body)));
