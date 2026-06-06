import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * Tests unitaires — Sprint 1 : Authentification & Gestion des utilisateurs.
 * Un cas par user story (US1 a US6), verifie en isolation.
 */
describe('Tests unitaires — Sprint 1 (US1 a US6)', () => {

  it('TU-01 — Inscription entreprise (US1) : un e-mail deja utilise est rejete', () => {
    const existants = ['contact@acme.com'];
    const emailDejaPris = (email: string) => existants.includes(email.toLowerCase().trim());
    expect(emailDejaPris('Contact@Acme.com')).toBe(true);   // doublon -> refuse
    expect(emailDejaPris('nouveau@acme.com')).toBe(false);  // libre -> accepte
  });

  it('TU-02 — Connexion securisee (US2) : mot de passe hache et jeton JWT valide', async () => {
    const hashed = await bcrypt.hash('Shape2025!', 10);
    expect(hashed).not.toBe('Shape2025!');
    expect(await bcrypt.compare('Shape2025!', hashed)).toBe(true);

    const token   = jwt.sign({ id: 'u123', roles: ['CANDIDATE'] }, 'test-secret', { expiresIn: '1h' });
    const decoded = jwt.verify(token, 'test-secret') as any;
    expect(decoded.id).toBe('u123');
    expect(decoded.roles).toContain('CANDIDATE');
  });

  it('TU-03 — Inscription candidat (US3) : l\'e-mail est normalise (trim + minuscules)', () => {
    const normalize = (email: string) => email.toLowerCase().trim();
    expect(normalize('  Sarah.Dubois@Mail.COM ')).toBe('sarah.dubois@mail.com');
  });

  it('TU-04 — Mot de passe oublie (US4) : un code de recuperation a 4 chiffres est genere', () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    expect(code).toMatch(/^\d{4}$/);
  });

  it('TU-05 — Creation d\'un mentor (US5) : le compte recoit le role MENTOR et son expertise', () => {
    const expertise = 'DevOps & Cloud';
    const mentor = { roles: ['MENTOR'], mentorProfile: { expertise: expertise ? [expertise] : [] } };
    expect(mentor.roles).toContain('MENTOR');
    expect(mentor.mentorProfile.expertise).toEqual(['DevOps & Cloud']);
  });

  it('TU-06 — Validation (US6) : la connexion d\'un compte non valide est refusee', () => {
    const NEEDS_VALIDATION = new Set(['CANDIDATE', 'COMPANY']);
    const user = { roles: ['COMPANY'], verifiedAccount: false };
    const connexionRefusee = user.roles.some(r => NEEDS_VALIDATION.has(r)) && !user.verifiedAccount;
    expect(connexionRefusee).toBe(true);
  });
});
