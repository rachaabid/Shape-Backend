import { Request, Response } from 'express';
import Formation from '../models/Formation';

// ── GET ALL ─────────────────────────────
export const getFormations = async (req: Request, res: Response) => {
  try {
    const start = Number(req.query.start) || 0;
    const count = Number(req.query.count) || 100;

    const data = await Formation.find({ deleted: false })
      .skip(start)
      .limit(count);

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching formations', err });
  }
};

// ── GET BY ID ───────────────────────────
export const getFormationById = async (req: Request, res: Response) => {
  try {
    const data = await Formation.findById(req.params.id);
    if (!data) return res.status(404).json({ message: 'Not found' });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Error', err });
  }
};

// ── CREATE ──────────────────────────────
export const createFormation = async (req: Request, res: Response) => {
  try {
    const formation = new Formation(req.body);
    const saved = await formation.save();

    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Create error', err });
  }
};

// ── UPDATE ──────────────────────────────
export const updateFormation = async (req: Request, res: Response) => {
  try {
    const updated = await Formation.findByIdAndUpdate(
      req.body.id,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Update error', err });
  }
};

// ── DELETE (soft delete) ────────────────
export const deleteFormation = async (req: Request, res: Response) => {
  try {
    await Formation.findByIdAndUpdate(req.params.id, {
      deleted: true
    });

    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Delete error', err });
  }
};

// ── COUNT (pour dashboard stats) ────────
export const countFormations = async (_req: Request, res: Response) => {
  try {
    const count = await Formation.countDocuments({ deleted: false });
    res.json(count);
  } catch (err) {
    res.status(500).json({ message: 'Count error', err });
  }
};