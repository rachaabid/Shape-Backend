import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host:   process.env.MAIL_HOST,
  port:   Number(process.env.MAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

transporter.verify()
  .then(() => console.log(`📧 SMTP prêt (${process.env.MAIL_HOST} as ${process.env.MAIL_USER})`))
  .catch(err => console.error('❌ SMTP non disponible :', err?.message || err));

interface InterviewEmailData {
  candidateName:  string;
  candidateEmail: string;
  companyName:    string;
  companyEmail:   string;
  jobTitle:       string;
  scheduledAt:    Date;
  channelName:    string;
  frontendUrl:    string;
  confirmToken?:  string;
}

interface CompanyProposalData {
  companyEmail:  string;
  companyName:   string;
  candidateName: string;
  jobTitle:      string;
  score:         number;
  proposedDate:  string;
  proposedTime:  string;
  frontendUrl:   string;
}

export const sendCompanyProposal = async (data: CompanyProposalData): Promise<void> => {
  await transporter.sendMail({
    from:    process.env.MAIL_FROM,
    to:      data.companyEmail,
    subject: `Candidature retenue — ${data.candidateName} pour ${data.jobTitle}`,
    html: `
      <h2>Candidature retenue par l'IA</h2>
      <p>Le candidat <strong>${data.candidateName}</strong> a obtenu un score de
         <strong>${data.score}%</strong> pour le poste de <strong>${data.jobTitle}</strong>.</p>
      <p>Date d'entretien proposée : <strong>${data.proposedDate} à ${data.proposedTime}</strong></p>
      <p>
        <a href="${data.frontendUrl}/company-panel/matching/candidates"
           style="background:#27a8ba;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">
          Voir les candidats retenus
        </a>
      </p>
      <hr/><small>Shape Platform</small>
    `,
  });
};

export const sendInterviewInvite = async (data: InterviewEmailData): Promise<void> => {
  const dateStr     = new Date(data.scheduledAt).toLocaleString('fr-FR');
  const meetingUrl  = `${data.frontendUrl}/company-panel/video-call/${data.channelName}`;
  const confirmUrl  = data.confirmToken
    ? `${data.frontendUrl}/confirm-interview?token=${data.confirmToken}&party=candidate`
    : meetingUrl;

  // Send to candidate
  await transporter.sendMail({
    from:    process.env.MAIL_FROM,
    to:      data.candidateEmail,
    subject: `Invitation à un entretien — ${data.jobTitle}`,
    html: `
      <h2>Bonjour ${data.candidateName},</h2>
      <p><strong>${data.companyName}</strong> vous invite à un entretien vidéo pour le poste de <strong>${data.jobTitle}</strong>.</p>
      <p><strong>Date :</strong> ${dateStr}</p>
      <p>
        <a href="${confirmUrl}" style="background:#27a8ba;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin-right:8px;">
          Confirmer ma présence
        </a>
        <a href="${meetingUrl}" style="background:#4F46E5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">
          Rejoindre l'entretien
        </a>
      </p>
      <p>Le lien sera actif à l'heure prévue. Bonne chance !</p>
      <hr/>
      <small>Shape Platform</small>
    `,
  });

  // Also notify company
  if (data.companyEmail) {
    const companyConfirmUrl = data.confirmToken
      ? `${data.frontendUrl}/confirm-interview?token=${data.confirmToken}&party=company`
      : meetingUrl;
    await transporter.sendMail({
      from:    process.env.MAIL_FROM,
      to:      data.companyEmail,
      subject: `Entretien planifié — ${data.candidateName} pour ${data.jobTitle}`,
      html: `
        <h2>Entretien planifié</h2>
        <p>Un entretien avec <strong>${data.candidateName}</strong> a été planifié pour le poste <strong>${data.jobTitle}</strong>.</p>
        <p><strong>Date :</strong> ${dateStr}</p>
        <p>
          <a href="${companyConfirmUrl}" style="background:#27a8ba;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin-right:8px;">
            Confirmer l'entretien
          </a>
          <a href="${meetingUrl}" style="background:#4F46E5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">
            Ouvrir la salle vidéo
          </a>
        </p>
        <hr/>
        <small>Shape Platform</small>
      `,
    });
  }
};

export const sendInterviewConfirmation = async (data: InterviewEmailData): Promise<void> => {
  const dateStr    = new Date(data.scheduledAt).toLocaleString('fr-FR');
  const meetingUrl = `${data.frontendUrl}/company-panel/video-call/${data.channelName}`;

  // email to company
  await transporter.sendMail({
    from:    process.env.MAIL_FROM,
    to:      data.companyEmail,
    subject: `Entretien confirmé — ${data.candidateName} pour ${data.jobTitle}`,
    html: `
      <h2>Entretien planifié</h2>
      <p>Un entretien avec <strong>${data.candidateName}</strong> a été planifié pour le poste de <strong>${data.jobTitle}</strong>.</p>
      <p><strong>Date :</strong> ${dateStr}</p>
      <p><a href="${meetingUrl}" style="background:#4F46E5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">
        Ouvrir la salle vidéo
      </a></p>
      <hr/>
      <small>Shape Platform</small>
    `,
  });
};

interface MentorCredentialsData {
  mentorName:  string;
  mentorEmail: string;
  login:       string;
  tempPassword: string;
  frontendUrl: string;
}

export const sendMentorCredentials = async (data: MentorCredentialsData): Promise<void> => {
  await transporter.sendMail({
    from:    process.env.MAIL_FROM,
    to:      data.mentorEmail,
    subject: 'Bienvenue sur Shape — Vos identifiants Mentor',
    html: `
      <h2>Bienvenue sur Shape, ${data.mentorName} !</h2>
      <p>Un compte Mentor a été créé pour vous. Voici vos identifiants de connexion :</p>
      <table style="border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:4px 12px;font-weight:bold;">Login :</td><td style="padding:4px 12px;">${data.login}</td></tr>
        <tr><td style="padding:4px 12px;font-weight:bold;">Mot de passe temporaire :</td><td style="padding:4px 12px;font-family:monospace;font-size:16px;">${data.tempPassword}</td></tr>
      </table>
      <p style="color:#c0392b;"><strong>Vous devrez changer votre mot de passe à la première connexion.</strong></p>
      <p>
        <a href="${data.frontendUrl}/login?role=mentor"
           style="background:#27a8ba;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">
          Se connecter
        </a>
      </p>
      <hr/><small>Shape Platform</small>
    `,
  });
};

interface AccountValidationData {
  userEmail: string;
  userName:  string;
  frontendUrl: string;
}

export const sendProgramApproved = async (data: { userEmail: string; userName: string; programTitle: string; frontendUrl: string }): Promise<void> => {
  await transporter.sendMail({
    from:    process.env.MAIL_FROM,
    to:      data.userEmail,
    subject: `Demande acceptée — ${data.programTitle}`,
    html: `
      <h2>Bonne nouvelle, ${data.userName} !</h2>
      <p>Votre demande d'inscription au programme <strong>${data.programTitle}</strong> a été <strong style="color:#27a8ba;">approuvée</strong>.</p>
      <p>Vous pouvez maintenant commencer ce programme depuis votre espace.</p>
      <p>
        <a href="${data.frontendUrl}/shaper-panel/courses"
           style="background:#27a8ba;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">
          Accéder à mes programmes
        </a>
      </p>
      <hr/><small>Shape Platform</small>
    `,
  });
};

export const sendProgramRejected = async (data: { userEmail: string; userName: string; programTitle: string; frontendUrl: string }): Promise<void> => {
  await transporter.sendMail({
    from:    process.env.MAIL_FROM,
    to:      data.userEmail,
    subject: `Demande refusée — ${data.programTitle}`,
    html: `
      <h2>Bonjour ${data.userName},</h2>
      <p>Votre demande d'inscription au programme <strong>${data.programTitle}</strong> a été <strong style="color:#e74c3c;">refusée</strong> par notre équipe.</p>
      <p>Pour plus d'informations, veuillez contacter votre administrateur.</p>
      <p>
        <a href="${data.frontendUrl}/shaper-panel/available-programs"
           style="background:#27a8ba;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">
          Voir les programmes disponibles
        </a>
      </p>
      <hr/><small>Shape Platform</small>
    `,
  });
};

export const sendAccountValidationEmail = async (data: AccountValidationData): Promise<void> => {
  await transporter.sendMail({
    from:    process.env.MAIL_FROM,
    to:      data.userEmail,
    subject: 'Votre compte Shape a été validé',
    html: `
      <h2>Bienvenue sur Shape, ${data.userName} !</h2>
      <p>Votre compte a été <strong>validé par notre équipe</strong>. Vous pouvez maintenant vous connecter à la plateforme.</p>
      <p>
        <a href="${data.frontendUrl}/login"
           style="background:#27a8ba;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">
          Se connecter
        </a>
      </p>
      <hr/><small>Shape Platform</small>
    `,
  });
};

export const sendInterviewReminder = async (data: InterviewEmailData): Promise<void> => {
  const dateStr    = new Date(data.scheduledAt).toLocaleString('fr-FR');
  const meetingUrl = `${data.frontendUrl}/company-panel/video-call/${data.channelName}`;

  const sendTo = async (to: string, name: string) => {
    await transporter.sendMail({
      from:    process.env.MAIL_FROM,
      to,
      subject: `Rappel — Votre entretien dans 30 minutes`,
      html: `
        <h2>Rappel d'entretien, ${name}</h2>
        <p>Votre entretien pour le poste de <strong>${data.jobTitle}</strong> commence dans <strong>30 minutes</strong>.</p>
        <p><strong>Date :</strong> ${dateStr}</p>
        <p><a href="${meetingUrl}" style="background:#4F46E5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">
          Rejoindre maintenant
        </a></p>
        <hr/>
        <small>Shape Platform</small>
      `,
    });
  };

  await Promise.all([
    sendTo(data.candidateEmail, data.candidateName),
    sendTo(data.companyEmail, data.companyName),
  ]);
};
