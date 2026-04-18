import { Request, Response } from 'express';
import { sendInterviewInvite, sendInterviewConfirmation, sendInterviewReminder } from '../services/email.service';

export const sendInvite = async (req: Request, res: Response): Promise<void> => {
  try {
    await sendInterviewInvite({ ...req.body, frontendUrl: process.env.FRONTEND_URL! });
    res.json({ message: 'Email d\'invitation envoyé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur envoi email', error: err });
  }
};

export const sendConfirmation = async (req: Request, res: Response): Promise<void> => {
  try {
    await sendInterviewConfirmation({ ...req.body, frontendUrl: process.env.FRONTEND_URL! });
    res.json({ message: 'Email de confirmation envoyé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur envoi email', error: err });
  }
};

export const sendReminder = async (req: Request, res: Response): Promise<void> => {
  try {
    await sendInterviewReminder({ ...req.body, frontendUrl: process.env.FRONTEND_URL! });
    res.json({ message: 'Email de rappel envoyé' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur envoi email', error: err });
  }
};
