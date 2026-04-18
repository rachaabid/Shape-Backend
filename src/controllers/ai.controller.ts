import { Response } from 'express';
import { rankWithPython } from '../services/matching.service';
import Application from '../models/JobOfferApplication';
import JobOffer from '../models/JobOffer';
import Company from '../models/Company';
import { AuthRequest } from '../middleware/auth.middleware';

export const matchCandidates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobOfferId } = req.params;

    const offer = await JobOffer.findById(jobOfferId);
    if (!offer) { res.status(404).json({ message: 'Offre non trouvée' }); return; }

    const applications = await Application.find({ jobOffer: jobOfferId }).populate('user');

    const candidates = applications
      .filter(a => a.user)
      .map(a => {
        const user = a.user as any;
        return {
          id:         user._id.toString(),
          hardSkills: user.hardSkills  || [],
          softwares:  user.softwares   || [],
          softSkills: user.softSkills  || [],
        };
      });

    const results = await rankWithPython(
      {
        hardSkills: offer.hardSkills,
        softwares:  offer.softwareSkills,
        softSkills: offer.softSkills,
      },
      candidates
    );

    await Promise.all(
      results.map(r =>
        Application.findOneAndUpdate(
          { jobOffer: jobOfferId, user: r.candidateId },
          { matchScore: r.score }
        )
      )
    );

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Erreur matching IA', error: err });
  }
};

export const scheduleInterview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { applicationId, scheduledAt } = req.body;

    const application = await Application.findById(applicationId)
      .populate('jobOffer')
      .populate('user');

    if (!application) { res.status(404).json({ message: 'Candidature non trouvée' }); return; }

    const company = await Company.findOne({ owner: req.userId });
    if (!company) { res.status(404).json({ message: 'Entreprise non trouvée' }); return; }

    const { default: Interview } = await import('../models/Interview');
    const channelName = `shape-interview-${applicationId}-${Date.now()}`;

    const interview = await Interview.create({
      applicationId,
      companyId:   company._id,
      candidateId: (application.user as any)._id,
      jobOfferId:  (application.jobOffer as any)._id,
      scheduledAt: new Date(scheduledAt),
      channelName,
    });

    res.status(201).json(interview);
  } catch (err) {
    res.status(500).json({ message: 'Erreur planification', error: err });
  }
};

export const getInterviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { default: Interview } = await import('../models/Interview');
    const company = await Company.findOne({ owner: req.userId });

    const interviews = await Interview.find({ companyId: company?._id })
      .populate('candidateId', '-password')
      .populate('jobOfferId', 'title')
      .sort({ scheduledAt: 1 });

    res.json(interviews);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err });
  }
};
