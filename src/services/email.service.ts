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

interface InterviewEmailData {
  candidateName:  string;
  candidateEmail: string;
  companyName:    string;
  companyEmail:   string;
  jobTitle:       string;
  scheduledAt:    Date;
  channelName:    string;
  frontendUrl:    string;
}

export const sendInterviewInvite = async (data: InterviewEmailData): Promise<void> => {
  const dateStr    = new Date(data.scheduledAt).toLocaleString('fr-FR');
  const meetingUrl = `${data.frontendUrl}/company-panel/video-call/${data.channelName}`;

  await transporter.sendMail({
    from:    process.env.MAIL_FROM,
    to:      data.candidateEmail,
    subject: `Invitation à un entretien — ${data.jobTitle}`,
    html: `
      <h2>Bonjour ${data.candidateName},</h2>
      <p><strong>${data.companyName}</strong> vous invite à un entretien vidéo pour le poste de <strong>${data.jobTitle}</strong>.</p>
      <p><strong>Date :</strong> ${dateStr}</p>
      <p><a href="${meetingUrl}" style="background:#4F46E5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">
        Rejoindre l'entretien
      </a></p>
      <p>Le lien sera actif à l'heure prévue. Bonne chance !</p>
      <hr/>
      <small>Shape Platform</small>
    `,
  });
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
