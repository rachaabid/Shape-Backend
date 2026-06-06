import CompanyTrainingProposal from '../models/CompanyTrainingProposal';
import { AuthRequest }        from '../middleware/auth.middleware';
import { asyncHandler }       from '../middleware/asyncHandler';
import { HttpError }          from '../utils/HttpError';

export const getAll = asyncHandler(async (_req, res) =>
  res.json(
    await CompanyTrainingProposal.find({ deleted: { $ne: true } })
      .populate('company', 'companyProfile login')
      .populate('proposedBy', '-password')
      .sort({ createdAt: -1 }),
  ));

export const getMine = asyncHandler<AuthRequest>(async (req, res) => {
  const { companyId } = req.query;
  const filter: any = { deleted: { $ne: true } };
  if (companyId) filter.company    = companyId;
  else           filter.proposedBy = req.userId;
  res.json(await CompanyTrainingProposal.find(filter).sort({ createdAt: -1 }));
});

export const create = asyncHandler<AuthRequest>(async (req, res) =>
  res.status(201).json(
    await CompanyTrainingProposal.create({ ...req.body, proposedBy: req.userId }),
  ));

const updateStatus = (status: 'accepted' | 'rejected') =>
  asyncHandler(async (req, res) => {
    const proposal = await CompanyTrainingProposal.findByIdAndUpdate(
      req.params['id'], { status }, { new: true },
    );
    if (!proposal) throw HttpError.notFound('Proposition non trouvée.');
    res.json(proposal);
  });

export const accept = updateStatus('accepted');
export const reject = updateStatus('rejected');
