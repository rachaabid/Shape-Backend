import { Request, Response } from 'express';
import { RtcTokenBuilder, RtcRole, RtmTokenBuilder } from 'agora-token';

const TOKEN_TTL = 3600; // 1 heure

// Lire les variables au moment de la requête (après dotenv.config())
const getEnv = () => ({
  appId:  process.env.AGORA_APP_ID          || '',
  appCert: process.env.AGORA_APP_CERTIFICATE || '',
});

// ── Token RTC (vidéo/audio) ────────────────────────────────
// GET /api/agora/rtc-token?channel=xxx&uid=0
export const getRtcToken = (req: Request, res: Response): void => {
  const { appId, appCert } = getEnv();
  const channel = (req.query['channel'] as string) || '';
  const uid     = parseInt(req.query['uid'] as string) || 0;

  if (!channel) {
    res.status(400).json({ message: 'Paramètre channel requis.' });
    return;
  }

  if (!appId || !appCert) {
    res.json({ token: null });
    return;
  }

  const expireAt = Math.floor(Date.now() / 1000) + TOKEN_TTL;
  const token    = RtcTokenBuilder.buildTokenWithUid(
    appId, appCert, channel, uid, RtcRole.PUBLISHER, expireAt, expireAt
  );

  res.json({ token });
};

// ── Token RTM (messagerie) ─────────────────────────────────
// GET /api/agora/rtm-token?userId=xxx
export const getRtmToken = (req: Request, res: Response): void => {
  const { appId, appCert } = getEnv();
  const userId = (req.query['userId'] as string) || '';

  if (!userId) {
    res.status(400).json({ message: 'Paramètre userId requis.' });
    return;
  }

  if (!appId || !appCert) {
    res.json({ token: null });
    return;
  }

  const expireAt = Math.floor(Date.now() / 1000) + TOKEN_TTL;
  const token    = RtmTokenBuilder.buildToken(
    appId, appCert, userId, expireAt
  );

  res.json({ token });
};
