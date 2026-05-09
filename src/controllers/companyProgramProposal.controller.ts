import { Request, Response } from 'express';
import CompanyProgramProposal from '../models/CompanyProgramProposal';
import { AuthRequest }        from '../middleware/auth.middleware';

export const getAll = async (_req: Request, res: Response): Promise<void> => {
  try {
    const proposals = await CompanyProgramProposal.find({ deleted: { $ne: true } })
      .populate('company',    'name logo')
      .populate('proposedBy', '-password')
      .sort({ createdAt: -1 });
    res.json(proposals);
  } catch (err) { res.status(500).json({ error: err }); }
};

export const getMine = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req.query;
    const filter: any = { deleted: { $ne: true } };
    if (companyId) filter.company = companyId;
    else           filter.proposedBy = req.userId;
    const proposals = await CompanyProgramProposal.find(filter).sort({ createdAt: -1 });
    res.json(proposals);
  } catch (err) { res.status(500).json({ error: err }); }
};

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const proposal = await CompanyProgramProposal.create({
      ...req.body,
      proposedBy: req.userId,
    });
    res.status(201).json(proposal);
  } catch (err) { res.status(500).json({ error: err }); }
};

export const accept = async (req: Request, res: Response): Promise<void> => {
  try {
    const proposal = await CompanyProgramProposal.findByIdAndUpdate(
      req.params.id, { status: 'accepted' }, { new: true }
    );
    if (!proposal) { res.status(404).json({ message: 'Proposition non trouvée.' }); return; }
    res.json(proposal);
  } catch (err) { res.status(500).json({ error: err }); }
};

export const reject = async (req: Request, res: Response): Promise<void> => {
  try {
    const proposal = await CompanyProgramProposal.findByIdAndUpdate(
      req.params.id, { status: 'rejected' }, { new: true }
    );
    if (!proposal) { res.status(404).json({ message: 'Proposition non trouvée.' }); return; }
    res.json(proposal);
  } catch (err) { res.status(500).json({ error: err }); }
};
