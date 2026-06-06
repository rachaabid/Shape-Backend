import cron from 'node-cron';
import Interview from '../models/Interview';
import JobOffer from '../models/JobOffer';
import { sendInterviewReminder } from './email.service';

export const startScheduler = (): void => {
  // Every minute: check for interviews starting in ~30 minutes and send reminders
  cron.schedule('* * * * *', async () => {
    try {
      const now      = new Date();
      const in30     = new Date(now.getTime() + 30 * 60 * 1000);
      const window   = new Date(now.getTime() + 31 * 60 * 1000);

      const upcoming = await Interview.find({
        scheduledAt: { $gte: in30, $lt: window },
        status:      'scheduled',
      })
        .populate('candidateId')
        .populate('companyId')
        .populate('jobOfferId');

      for (const interview of upcoming) {
        const candidate = interview.candidateId as any;
        const company   = interview.companyId   as any; // User (rôle COMPANY)
        const offer     = interview.jobOfferId   as any;

        const cName = company.companyProfile?.companyName;

        await sendInterviewReminder({
          candidateName:  `${candidate.firstName?.fr || candidate.login}`,
          candidateEmail: candidate.email,
          companyName:    cName?.fr || cName?.en || company.login,
          companyEmail:   company.email || '',
          jobTitle:       offer.title,
          scheduledAt:    interview.scheduledAt,
          channelName:    interview.channelName,
          frontendUrl:    process.env.FRONTEND_URL!,
        });

        console.log(`📧 Rappel envoyé pour l'entretien ${interview._id}`);
      }
    } catch (err) {
      console.error('Scheduler error:', err);
    }
  });

  // Every day at midnight: close expired job offers
  cron.schedule('0 0 * * *', async () => {
    try {
      const result = await JobOffer.updateMany(
        { deadline: { $lt: new Date() }, status: 'open' },
        { status: 'closed' }
      );
      if (result.modifiedCount > 0) {
        console.log(`📋 ${result.modifiedCount} offres expirées fermées`);
      }
    } catch (err) {
      console.error('Job offer cleanup error:', err);
    }
  });

  // Note : l'ancien push de KPI vers Power BI cloud (Azure AD) est désactivé.
  // L'intégration Power BI passe désormais par Power BI Desktop qui consomme
  // les endpoints /api/bi-export/* en direct — pas de scheduler nécessaire.
  // Le code Azure reste disponible dans powerbi.service.ts si on revient
  // un jour à un workflow cloud.

  console.log('⏰ Scheduler démarré');
};
