/**
 * seed-stress.ts — Jeu de données volumineux et varié pour tester Shape
 * à ses limites (volume, cas limites, tous les statuts).
 *
 * Exécution : npm run seed:stress
 *
 * ⚠️  Vide TOUTES les collections avant insertion.
 */
import mongoose from 'mongoose';
import bcrypt   from 'bcryptjs';
import dotenv   from 'dotenv';
dotenv.config();

import User              from '../src/models/User';
import Company           from '../src/models/Company';
import HardSkill         from '../src/models/HardSkill';
import SoftwareSkill     from '../src/models/SoftwareSkill';
import FocusedSkill      from '../src/models/FocusedSkill';
import Career            from '../src/models/Career';
import JobOfferModel     from '../src/models/JobOfferModel';
import Training           from '../src/models/Training';
import Quiz              from '../src/models/Quiz';
import TextBloc          from '../src/models/TextBloc';
import VideoYoutube      from '../src/models/VideoYoutube';
import JobOffer          from '../src/models/JobOffer';
import Application       from '../src/models/JobOfferApplication';
import Interview         from '../src/models/Interview';
import Task              from '../src/models/Task';
import Inscription       from '../src/models/Inscription';
import Conversation      from '../src/models/Conversation';
import Message           from '../src/models/Message';
import Notification      from '../src/models/Notification';
import NotificationSetting from '../src/models/NotificationSetting';
import MentorEvaluation  from '../src/models/MentorEvaluation';
import TrainingRequest    from '../src/models/TrainingRequest';
import CompanyTrainingProposal from '../src/models/CompanyTrainingProposal';
import Documentation     from '../src/models/Documentation';

// ── Helpers ────────────────────────────────────────────────────────
const rnd  = (n: number) => Math.floor(Math.random() * n);
const pick = <T>(arr: T[]): T => arr[rnd(arr.length)];
const pickN = <T>(arr: T[], n: number): T[] => {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length; i++) out.push(copy.splice(rnd(copy.length), 1)[0]);
  return out;
};
const daysAgo  = (n: number) => new Date(Date.now() - n * 86_400_000);
const daysAhead = (n: number) => new Date(Date.now() + n * 86_400_000);
const chance = (p: number) => Math.random() < p;

// ── Données de base ────────────────────────────────────────────────
const FIRST_NAMES = ['Sarah','Mohamed','Leila','Thomas','Fatima','Lucas','Yasmine','Antoine','Amira','Mathieu','Rania','Kevin','Houda','Pierre','Nadia','Karim','Samira','David','Meriem','Théo','Imane','Hugo','Sonia','Walid','Inès','Ayoub','Chloé','Bilal','Manon','Omar','Camille','Sami','Julie','Nabil','Laura','Reda','Emma','Ziad','Sophie','Anis'];
const LAST_NAMES  = ['Dubois','Amara','Mansouri','Martin','Benali','Bernard','Khelifi','Dupont','Touati','Leroy','Saidi','Moreau','Chakroun','Lambert','Bouzid','Haddad','Hadj','Richard','Trabelsi','Fontaine','Bensalem','Garnier','Cherif','Brahimi','Faure','Slimani','Roux','Othmani','Girard','Nasri'];
const COUNTRIES = [
  { name: { fr: 'France',  en: 'France',  ar: 'فرنسا'  }, code: 'FR', flag: '🇫🇷' },
  { name: { fr: 'Algérie', en: 'Algeria', ar: 'الجزائر' }, code: 'DZ', flag: '🇩🇿' },
  { name: { fr: 'Maroc',   en: 'Morocco', ar: 'المغرب' }, code: 'MA', flag: '🇲🇦' },
  { name: { fr: 'Tunisie', en: 'Tunisia', ar: 'تونس'   }, code: 'TN', flag: '🇹🇳' },
  { name: { fr: 'Belgique',en: 'Belgium', ar: 'بلجيكا' }, code: 'BE', flag: '🇧🇪' },
  { name: { fr: 'Canada',  en: 'Canada',  ar: 'كندا'   }, code: 'CA', flag: '🇨🇦' },
  // cas limite : seulement le fr
  { name: { fr: 'Sénégal' },                              code: 'SN', flag: '🇸🇳' },
  // cas limite : seulement l'arabe
  { name: { ar: 'الإمارات' },                             code: 'AE', flag: '🇦🇪' },
];
const HARD_SKILLS = ['SEO / Référencement','Social Media Marketing','Marketing de contenu','Email Marketing','Google Ads / SEA','Analyse web / Analytics','Community Management','Marketing d\'influence','Copywriting','Growth Hacking','E-commerce','Stratégie digitale','Création vidéo','A/B Testing','Gestion de campagnes'];
const SOFT_SKILLS = ['Créativité','Communication','Organisation','Rigueur','Curiosité','Analyse','Leadership','Adaptabilité','Autonomie','Storytelling','Initiative','Résilience'];
const SOFTWARES   = ['Hootsuite','Canva','Meta Business Suite','SEMrush','Ahrefs','Google Search Console','Mailchimp','Klaviyo','HubSpot','Google Analytics','Notion','Buffer','Adobe Premiere Pro','WordPress','Shopify','CapCut','Figma','Trello'];
const FOCUSED     = ['Marketing Digital','Branding','Data Marketing','UX Writing','Stratégie de marque'];
const CAREERS     = ['Community Manager','Spécialiste SEO','Créateur de contenu','Chargé de publicité','Responsable Marketing','Growth Marketer','Brand Manager'];
const DOMAINS     = ['Marketing','Communication','Digital','Vente','Data'];
const PROGRAM_TITLES = ['Social Media Marketing','SEO & Référencement','Content Marketing','Email Marketing','Google Ads & Paid Media','Analytics & Data','Community Management','Marketing d\'influence','Growth Hacking','E-commerce','Brand Strategy','UX Writing','Video Marketing','Influencer Relations','Marketing Automation'];
// Statuts de candidature : 0=AutoSuggested 1=Applied 2=Rejected 3=Interview 4=Hired 5=Intern

async function seed() {
  await mongoose.connect(process.env.MONGO_URI!);
  console.log('✅ MongoDB connecté —', process.env.MONGO_URI);

  // ── 1. Purge ──────────────────────────────────────────────────────
  await Promise.all([
    User.deleteMany({}), Company.deleteMany({}),
    HardSkill.deleteMany({}), SoftwareSkill.deleteMany({}),
    FocusedSkill.deleteMany({}), Career.deleteMany({}),
    JobOfferModel.deleteMany({}), Training.deleteMany({}), Quiz.deleteMany({}),
    TextBloc.deleteMany({}), VideoYoutube.deleteMany({}), JobOffer.deleteMany({}),
    Application.deleteMany({}), Interview.deleteMany({}), Task.deleteMany({}),
    Inscription.deleteMany({}), Conversation.deleteMany({}),
    Message.deleteMany({}), Notification.deleteMany({}), NotificationSetting.deleteMany({}),
    MentorEvaluation.deleteMany({}), TrainingRequest.deleteMany({}),
    CompanyTrainingProposal.deleteMany({}), Documentation.deleteMany({}),
  ]);
  // Supprime les anciennes collections orphelines (renommage Program → Training)
  for (const legacy of ['programs', 'programrequests', 'companyprogramproposals', 'taskresponses', 'taskresponsecomments', 'quizresponses']) {
    await mongoose.connection.db!.dropCollection(legacy).catch(() => {});
  }
  console.log('🗑️  Toutes les collections vidées');

  // ── 2. Référentiel ────────────────────────────────────────────────
  const hardSkills: any[] = await HardSkill.insertMany(
    HARD_SKILLS.map((n, i) => ({ name: { fr: n, en: n, ...(i % 4 ? { ar: n } : {}) }, category: pick(DOMAINS) })),
  );
  const softwares: any[] = await SoftwareSkill.insertMany(
    SOFTWARES.map((n, i) => ({ name: { fr: n, en: n, ...(i % 3 ? { ar: n } : {}) }, category: 'Outil' })),
  );
  const focused: any[] = await FocusedSkill.insertMany(
    FOCUSED.map(n => ({ name: { fr: n, en: n }, category: 'Marketing' })),
  );
  const jobModels: any[] = await JobOfferModel.insertMany([
    { name: { fr: 'CDI',        en: 'Permanent'   } },
    { name: { fr: 'CDD',        en: 'Fixed-term'  } },
    { name: { fr: 'Stage',      en: 'Internship'  } },
    { name: { fr: 'Alternance', en: 'Apprentice'  } },
    { name: { fr: 'Freelance',  en: 'Freelance'   } },
  ]);
  await Career.insertMany(CAREERS.map(n => ({ name: { fr: n, en: n }, domain: pick(DOMAINS) })));
  console.log('✅ Référentiel inséré');

  const pw      = await bcrypt.hash('Shape2025!', 10);
  const adminPw = await bcrypt.hash('Admin2025!', 10);

  // ── 3. Contenus (Quiz / TextBloc / Video) pour les programmes ─────
  const quizzes: any[] = await Quiz.insertMany(
    Array.from({ length: 20 }, (_, i) => ({
      title: { fr: `Quiz ${i + 1}`, en: `Quiz ${i + 1}` },
      online: true, duration: 10 + rnd(20), deadLineInHours: 72,
      keyWords: pickN(SOFT_SKILLS, 3),
      sections: [{
        text: { fr: 'Section 1' },
        questions: [{
          text: { fr: 'Question exemple ?' },
          questionType: 'single',
          options: [
            { text: { fr: 'Réponse A' }, score: 1 },
            { text: { fr: 'Réponse B' }, score: 0 },
          ],
        }],
      }],
    })),
  );
  const textBlocs: any[] = await TextBloc.insertMany(
    Array.from({ length: 20 }, (_, i) => ({
      title: { fr: `Leçon ${i + 1}`, en: `Lesson ${i + 1}` },
      online: true, keyWords: pickN(HARD_SKILLS, 2),
      html: `<h2>Leçon ${i + 1}</h2><p>Contenu pédagogique de test pour la leçon ${i + 1}.</p>`,
    })),
  );
  const videos: any[] = await VideoYoutube.insertMany(
    Array.from({ length: 20 }, (_, i) => ({
      title: { fr: `Vidéo ${i + 1}`, en: `Video ${i + 1}` },
      online: true, keyWords: pickN(HARD_SKILLS, 2),
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    })),
  );

  // ── 3a. Tâches pour les programmes (créées ici pour être disponibles à l'étape 5) ──
  const trainingTasks: any[] = await Task.insertMany(
    Array.from({ length: 20 }, (_, i) => ({
      title: { fr: `Tâche programme ${i + 1}`, en: `Training Task ${i + 1}` },
      description: { fr: `Exercice pratique ${i + 1} à rendre dans les délais.` },
      keyWords: pickN(HARD_SKILLS, 2),
      online: true, deadLineInHours: 24 + rnd(96),
    })),
  );
  console.log(`✅ ${trainingTasks.length} tâches-programme créées`);

  // ── 3b. Documentation (ressources PDF pour les cours) ────────────────
  const DOC_SAMPLES = [
    {
      title: { fr: 'Introduction au Marketing Digital', en: 'Introduction to Digital Marketing' },
      description: { fr: 'Guide complet pour démarrer en marketing digital.' },
      keyWords: ['marketing', 'digital', 'SEO'],
      online: true,
      documents: [
        { title: { fr: 'Guide PDF' }, url: 'https://www.w3.org/WAI/WCAG21/wcag21.pdf' },
        { title: { fr: 'Fiche résumé' }, url: 'https://www.africau.edu/images/default/sample.pdf' },
      ],
    },
    {
      title: { fr: 'Stratégie de Contenu', en: 'Content Strategy' },
      description: { fr: 'Apprenez à créer une stratégie de contenu efficace.' },
      keyWords: ['contenu', 'stratégie', 'copywriting'],
      online: true,
      documents: [
        { title: { fr: 'Template stratégie' }, url: 'https://www.africau.edu/images/default/sample.pdf' },
      ],
    },
    {
      title: { fr: 'SEO & Référencement', en: 'SEO & Search Engine Optimization' },
      description: { fr: 'Les bases du référencement naturel et les bonnes pratiques.' },
      keyWords: ['SEO', 'référencement', 'Google'],
      online: true,
      documents: [
        { title: { fr: 'Checklist SEO' }, url: 'https://www.africau.edu/images/default/sample.pdf' },
        { title: { fr: 'Guide Google Analytics' }, url: 'https://www.w3.org/WAI/WCAG21/wcag21.pdf' },
      ],
    },
    {
      title: { fr: 'Community Management', en: 'Community Management' },
      description: { fr: 'Gérer et animer une communauté en ligne.' },
      keyWords: ['community', 'réseaux sociaux', 'engagement'],
      online: true,
      documents: [
        { title: { fr: 'Calendrier éditorial' }, url: 'https://www.africau.edu/images/default/sample.pdf' },
      ],
    },
    {
      title: { fr: 'Email Marketing', en: 'Email Marketing' },
      description: { fr: 'Créer des campagnes email performantes.' },
      keyWords: ['email', 'newsletter', 'conversion'],
      online: true,
      documents: [
        { title: { fr: 'Templates email' }, url: 'https://www.africau.edu/images/default/sample.pdf' },
        { title: { fr: 'Guide Mailchimp' }, url: 'https://www.w3.org/WAI/WCAG21/wcag21.pdf' },
      ],
    },
  ];
  const documentations: any[] = await Documentation.insertMany(DOC_SAMPLES);
  console.log(`✅ ${documentations.length} documentations créées`);

  // ── 4. Mentors (créés avant les programmes pour l'assignation owner) ─
  const mentors: any[] = [];
  for (let i = 0; i < 20; i++) {
    const m = await User.create({
      login: `mentor${i}`, email: `mentor${i}@shape-test.com`, password: pw,
      roles: ['MENTOR'], firstName: { fr: pick(FIRST_NAMES), en: pick(FIRST_NAMES) },
      lastName: { fr: pick(LAST_NAMES) }, jobTitle: pick(CAREERS),
      verifiedAccount: true, createdAt: daysAgo(rnd(400)),
    });
    mentors.push(m);
  }
  console.log(`✅ ${mentors.length} mentors créés`);

  // ── 5. Programmes (30 — variés, chaque mentor est owner d'1-2 prog) ─
  const trainingsPayload = Array.from({ length: 30 }, (_, i) => {
    const title = `${pick(PROGRAM_TITLES)} ${i + 1}`;
    // 1 programme sur 6 est hors-ligne ; 1 sur 8 sans contenu (cas limites).
    const online   = i % 6 !== 0;
    const hasCourses = i % 8 !== 0;
    return {
      title: { fr: title, en: title, ...(i % 3 ? { ar: title } : {}) },
      description: { fr: `Programme de formation ${title}.` },
      owner: mentors[i % mentors.length]._id,
      online, price: rnd(5) * 100, priceEur: rnd(5) * 30, duration: 4 + rnd(20),
      weeks: hasCourses ? (() => {
        const tb   = pick(textBlocs);
        const vid  = pick(videos);
        const doc  = pick(documentations);
        const task = pick(trainingTasks);
        const quiz = pick(quizzes);
        const deadline = new Date(Date.now() + 72 * 3600_000);
        return [
          {
            title: { fr: 'Semaine 1', en: 'Week 1', ar: 'الأسبوع 1' },
            lessons: [
              {
                title:       tb.title,
                htmlContent: tb.html,
                keyWords:    tb.keyWords ?? [],
              },
              {
                title:    vid.title,
                videoUrl: vid.url,
                keyWords: vid.keyWords ?? [],
              },
              {
                title: doc.title,
                folders: (doc.documents ?? []).map((d: any) => ({
                  fileName: typeof d.title === 'string' ? d.title : (d.title?.fr || d.title?.en || 'Document'),
                  fileSize: 0,
                  url: d.url,
                })),
              },
              {
                title:           task.title,
                learningOutcome: typeof task.description === 'string' ? task.description : (task.description?.fr || ''),
                taskRef:         task._id.toString(),
                keyWords:        task.keyWords ?? [],
              },
            ],
          },
          {
            title: { fr: 'Semaine 2', en: 'Week 2', ar: 'الأسبوع 2' },
            lessons: [
              {
                title:   quiz.title,
                quizzes: [{
                  id:              quiz._id.toString(),
                  title:           quiz.title,
                  hoursToComplete: quiz.duration ?? 10,
                  deadline:        deadline.toISOString(),
                }],
                keyWords: quiz.keyWords ?? [],
              },
            ],
          },
        ];
      })() : [],
    };
  });
  const trainings: any[] = await Training.insertMany(trainingsPayload);
  console.log(`✅ ${trainings.length} programmes créés (avec owner assigné)`);

  // ── 5b. Lier chaque tâche-programme à son programme ─────────────────
  // (fait après la création des programmes car les tâches sont créées avant)
  for (const prog of trainings) {
    for (const week of (prog as any).weeks || []) {
      for (const lesson of (week.lessons || []) as any[]) {
        if (lesson.taskRef) {
          await Task.findByIdAndUpdate(lesson.taskRef, { training: prog._id });
        }
      }
    }
  }
  console.log('✅ Tâches-programme liées à leurs programmes');

  // ── 6. Entreprises + comptes COMPANY (25, dont 1 sans offre) ──────
  const companyUsers: any[] = [];
  const companies: any[] = [];
  for (let i = 0; i < 25; i++) {
    const verified = i % 7 !== 0;            // ~1/7 non vérifiée
    const deleted  = i === 24;               // 1 entreprise supprimée (soft)
    const u = await User.create({
      login: `company${i}`, email: `company${i}@shape-test.com`, password: pw,
      roles: ['COMPANY'], firstName: { fr: pick(FIRST_NAMES) }, lastName: { fr: pick(LAST_NAMES) },
      verifiedAccount: verified, deleted, createdAt: daysAgo(rnd(500)),
    });
    const c = await Company.create({
      name: { fr: `Entreprise ${i}`, en: `Company ${i}` },
      address: { fr: `${pick(COUNTRIES).name.fr || 'Ville'}, ${10 + i} rue Test` },
      owner: u._id, deleted,
    });
    companyUsers.push(u); companies.push(c);
  }
  console.log(`✅ ${companies.length} entreprises créées`);

  // ── 7. Candidats (150 — répartition de statuts variée) ────────────
  const candidates: any[] = [];
  for (let i = 0; i < 150; i++) {
    const ctry = pick(COUNTRIES);
    // ~1/9 non vérifié, 1/30 supprimé (cas limites).
    const verified = i % 9 !== 0;
    const deleted  = i % 30 === 29;
    const c = await User.create({
      login: `candidate${i}`, email: `candidate${i}@shape-test.com`, password: pw,
      roles: ['CANDIDATE'],
      firstName: { fr: pick(FIRST_NAMES), ...(i % 4 ? { en: pick(FIRST_NAMES) } : {}) },
      lastName:  { fr: pick(LAST_NAMES) },
      gender: rnd(3), country: ctry.code,
      phoneNumber: chance(0.8) ? `+216 ${20000000 + rnd(9999999)}` : undefined,
      interfaceLanguage: pick(['fr', 'en', 'ar']),
      workingMode: pick(['Présentiel', 'Télétravail', 'Hybride']),
      languages: pickN(['fr', 'en', 'ar', 'es'], 1 + rnd(3)),
      softSkills: pickN(SOFT_SKILLS, 1 + rnd(4)),
      hardSkills: pickN(hardSkills, 1 + rnd(4)).map(s => ({ skill: s._id, level: 1 + rnd(5) })),
      softwares:  pickN(softwares,  1 + rnd(4)).map(s => ({ skill: s._id, level: 1 + rnd(5) })),
      focusedSkills: pickN(focused, rnd(3)).map(s => s._id.toString()),
      verifiedAccount: verified, deleted,
      createdAt: daysAgo(rnd(540)),
    });
    candidates.push(c);
  }
  console.log(`✅ ${candidates.length} candidats créés`);

  // ── 8. Admins ─────────────────────────────────────────────────────
  await User.insertMany([
    { login: 'admin',  email: 'admin@shape.fr',   password: adminPw, roles: ['ADMIN'], verifiedAccount: true },
    { login: 'admin2', email: 'admin2@shape.fr',  password: adminPw, roles: ['ADMIN'], verifiedAccount: true },
  ]);

  // ── 9. Offres d'emploi (80 — réparties sur les entreprises) ───────
  const jobOffers: any[] = [];
  for (let i = 0; i < 80; i++) {
    // L'entreprise 0 reçoit beaucoup d'offres ; l'entreprise 23 n'en reçoit aucune.
    const compIdx = i < 20 ? 0 : 1 + rnd(22);
    const o = await JobOffer.create({
      company: companies[compIdx]._id,
      jobOfferModel: pick(jobModels)._id,
      workingMode: pick(['remote', 'onsite', 'hybrid', 'freelance']),
      title: `Offre ${i} — ${pick(CAREERS)}`,
      description: `Description détaillée de l'offre ${i}.`,
      profilesNeeded: 1 + rnd(4),
      softSkills: pickN(SOFT_SKILLS, 2 + rnd(3)),
      hardSkills: pickN(hardSkills, 2 + rnd(3)).map(s => ({ skill: s._id, level: 1 + rnd(5) })),
      softwareSkills: pickN(softwares, 1 + rnd(3)).map(s => ({ skill: s._id, level: 1 + rnd(5) })),
      status: chance(0.8) ? 'open' : 'closed',
      createdAt: daysAgo(rnd(400)),
    });
    jobOffers.push(o);
  }
  console.log(`✅ ${jobOffers.length} offres d'emploi créées`);

  // ── 10. Candidatures (600 — tous les statuts 0..5) ────────────────
  const applications: any[] = [];
  for (let i = 0; i < 600; i++) {
    const cand  = pick(candidates);
    const offer = pick(jobOffers);
    const a = await Application.create({
      user: cand._id, jobOffer: offer._id,
      status: rnd(6),                                  // 0..5 — tous les statuts
      matchScore:    rnd(101),
      skillScore:    rnd(101),
      semanticScore: rnd(101),
      matchedSkills: pickN(HARD_SKILLS, rnd(4)),
      missingSkills: pickN(HARD_SKILLS, rnd(3)),
      createdAt: daysAgo(rnd(380)),
    });
    applications.push(a);
  }
  console.log(`✅ ${applications.length} candidatures créées`);

  // ── 11. Entretiens (150 — scheduled / completed / cancelled) ──────
  let itvCount = 0;
  for (let i = 0; i < 150; i++) {
    const app = pick(applications);
    const offer = jobOffers.find(o => o._id.equals(app.jobOffer));
    if (!offer) continue;
    const statusRoll = rnd(3);
    const status = ['scheduled', 'completed', 'cancelled'][statusRoll];
    await Interview.create({
      applicationId: app._id, companyId: offer.company, candidateId: app.user,
      jobOfferId: offer._id,
      scheduledAt: status === 'scheduled' ? daysAhead(1 + rnd(20)) : daysAgo(rnd(200)),
      channelName: `shape-itv-${i}`,
      status,
      confirmedByCandidate: chance(0.7),
      confirmedByCompany:   chance(0.8),
      notes: status === 'cancelled' ? 'Entretien annulé.' : undefined,
    });
    itvCount++;
  }
  console.log(`✅ ${itvCount} entretiens créés`);

  // ── 12. Inscriptions (250 — mentor parfois assigné) ───────────────
  const inscriptions: any[] = [];
  for (let i = 0; i < 250; i++) {
    const cand = pick(candidates);
    // mentor 19 reste sans stagiaire (cas limite) → on tire parmi 0..18.
    const withMentor = chance(0.7);
    let selectedMentor: any = undefined;
    let selectedTrainings: any[];

    if (withMentor) {
      selectedMentor = mentors[rnd(19)];
      // Use only trainings owned by this mentor for coherence
      const mentorOwned = trainings.filter((p: any) =>
        p.owner && (p.owner.equals ? p.owner.equals(selectedMentor._id) : String(p.owner) === String(selectedMentor._id))
      );
      selectedTrainings = mentorOwned.length > 0
        ? pickN(mentorOwned, 1).map(p => p._id)
        : pickN(trainings, 1 + rnd(2)).map(p => p._id);
    } else {
      selectedTrainings = pickN(trainings, 1 + rnd(3)).map(p => p._id);
    }

    const ins = await Inscription.create({
      user: cand._id,
      trainings: selectedTrainings,
      mentor: selectedMentor?._id,
      status: pick(['active', 'completed']),
      createdAt: daysAgo(rnd(300)),
    });
    inscriptions.push(ins);
  }
  console.log(`✅ ${inscriptions.length} inscriptions créées`);

  // ── 12b. Réponses aux tâches-programme (via inscriptions) ────────
  // Pour chaque inscription, retrouver les tâches dans les semaines du programme
  // et créer une TaskResponse owner=candidat.
  let progTrCount = 0;
  for (const ins of pickN(inscriptions, 180)) {
    for (const progId of (ins.trainings || [])) {
      const prog = trainings.find((p: any) =>
        p._id.toString() === progId.toString()
      );
      if (!prog?.weeks) continue;
      for (const week of prog.weeks) {
        for (const lesson of (week.lessons || []) as any[]) {
          if (!lesson.taskRef) continue;
          const task = trainingTasks.find(
            (t: any) => t._id.toString() === lesson.taskRef
          );
          if (!task) continue;
          task.responses = task.responses || [];
          (task.responses as any).push({
            owner:       ins.user,
            inscription: ins._id,
            status:      rnd(4),
            createdAt:   daysAgo(rnd(200)),
          });
          await task.save();
          progTrCount++;
        }
      }
    }
  }
  console.log(`✅ ${progTrCount} réponses aux tâches-programme créées`);

  // ── 13. Tâches (200) + réponses (700, statuts 0..3) ───────────────
  // Chaque tâche est rattachée à un programme (champ training) pour que le
  // frontend puisse les récupérer via GET /Task/ByAttribute/training/{id}.
  const tasks: any[] = [];
  for (let i = 0; i < 200; i++) {
    // Choisir un mentor, puis un programme qu'il possède (cohérence mentor ↔ programme)
    const mentor = pick(mentors);
    const mentorProgs = trainings.filter((p: any) =>
      p.owner && (p.owner.equals ? p.owner.equals(mentor._id) : String(p.owner) === String(mentor._id))
    );
    const prog = mentorProgs.length > 0 ? pick(mentorProgs) : pick(trainings);
    const t = await Task.create({
      title: { fr: `Tâche ${i}`, en: `Task ${i}` },
      description: { fr: `Description de la tâche ${i}.` },
      keyWords: pickN(HARD_SKILLS, 2),
      online: true, deadLineInHours: 12 + rnd(160),
      createdBy: mentor._id,
      training: prog._id,
      createdAt: daysAgo(rnd(250)),
    });
    tasks.push(t);
  }
  let trCount = 0;
  for (let i = 0; i < 700; i++) {
    const cand = pick(candidates);
    const t    = pick(tasks);
    // Chercher une inscription du candidat qui inclut le programme de la tâche
    const candIns = inscriptions.filter((ins: any) =>
      String(ins.user) === String(cand._id) &&
      (ins.trainings || []).some((p: any) => p.toString() === t.training?.toString())
    );
    // Fallback : n'importe quelle inscription du candidat (~40% sans inscription)
    const fallbackIns = inscriptions.filter((ins: any) =>
      String(ins.user) === String(cand._id)
    );
    const ins = candIns.length
      ? pick(candIns)
      : (chance(0.4) && fallbackIns.length ? pick(fallbackIns) : undefined);
    t.responses = t.responses || [];
    (t.responses as any).push({
      owner: cand._id,
      inscription: ins?._id,
      status: rnd(4),
      createdAt: daysAgo(rnd(200)),
    });
    await t.save();
    trCount++;
  }
  console.log(`✅ ${tasks.length} tâches + ${trCount} réponses créées`);

  // ── 14. Conversations (120) + messages (≈2000) ────────────────────
  let convCount = 0, msgCount = 0;
  for (let i = 0; i < 120; i++) {
    const a = pick(candidates);
    const b = chance(0.6) ? pick(mentors) : pick(companyUsers);
    if (a._id.equals(b._id)) continue;
    const convo = await Conversation.create({ participants: [a._id, b._id] });
    convCount++;
    const n = 5 + rnd(25);
    let last: any = null;
    for (let j = 0; j < n; j++) {
      const sender = chance(0.5) ? a : b;
      last = await Message.create({
        conversationId: convo._id, sender: sender._id,
        content: `Message ${j} de la conversation ${i}.`,
        type: 'text', read: chance(0.6),
        createdAt: daysAgo(rnd(120)),
      });
      msgCount++;
    }
    if (last) {
      await Conversation.findByIdAndUpdate(convo._id, {
        lastMessage: last.content, lastMessageAt: last.createdAt, lastMessageSender: last.sender,
      });
    }
  }
  console.log(`✅ ${convCount} conversations + ${msgCount} messages créés`);

  // ── 15. Notifications (400) ───────────────────────────────────────
  const NOTIF_TYPES = ['NEW_REGISTRATION','NEW_JOB_OFFER','NEW_APPLICATION','NEW_INTERVIEW','MENTOR_TASK','MENTOR_EVALUATION'];
  const allUsers = [...candidates, ...mentors, ...companyUsers];
  let notifCount = 0;
  for (let i = 0; i < 400; i++) {
    await Notification.create({
      userId: pick(allUsers)._id,
      type: pick(NOTIF_TYPES),
      message: `Notification de test n°${i}.`,
      read: chance(0.4),
      createdAt: daysAgo(rnd(90)),
    });
    notifCount++;
  }
  // NotificationSetting pour un échantillon d'utilisateurs
  for (const u of pickN(allUsers, 60)) {
    await NotificationSetting.create({ userId: u._id });
  }
  console.log(`✅ ${notifCount} notifications créées`);

  // ── 16. Évaluations mentor (90) ───────────────────────────────────
  let evalCount = 0;
  for (const ins of pickN(inscriptions.filter(i => i.mentor), 90)) {
    const technical = rnd(11), behavior = rnd(11), communication = rnd(11), initiative = rnd(11);
    await MentorEvaluation.create({
      mentor: ins.mentor, intern: ins.user, inscription: ins._id,
      period: pick(['P1', 'P2', 'P3', 'P4']),
      technical, behavior, communication, initiative,
      globalScore: Math.round((technical + behavior + communication + initiative) / 4),
      comment: '',
    });
    evalCount++;
  }
  console.log(`✅ ${evalCount} évaluations mentor créées`);

  // ── 17. Demandes de programme (120 — pending/approved/rejected) ──
  let reqCount = 0;
  for (const ins of pickN(inscriptions, 120)) {
    await TrainingRequest.create({
      user: ins.user,
      training: pick(ins.trainings as any[]),
      inscription: ins._id,
      status: pick(['pending', 'approved', 'rejected']),
    });
    reqCount++;
  }
  console.log(`✅ ${reqCount} demandes de programme créées`);

  // ── 18. Propositions de formation des entreprises (60) ───────────
  const PROPOSAL_TITLES = ['Formation Marketing Digital','Atelier Growth Hacking','Formation SEO avancé','Bootcamp Community Manager','Formation Email Marketing','Atelier Créa Vidéo','Formation Data & Analytics','Bootcamp Social Media','Formation Brand Strategy','Atelier Copywriting'];
  const CAREERS_LIST    = ['Community Manager','Spécialiste SEO','Chargé de publicité','Growth Marketer','Brand Manager'];
  const AUDIENCES       = ['Candidats juniors','Candidats seniors','Alternants','Stagiaires'];
  let proposalCount = 0;
  for (let i = 0; i < 60; i++) {
    const cu = pick(companyUsers);
    const co = companies.find((c: any) => c.owner?.equals ? c.owner.equals(cu._id) : String(c.owner) === String(cu._id));
    if (!co) continue;
    await CompanyTrainingProposal.create({
      company:        co._id,
      proposedBy:     cu._id,
      title:          pick(PROPOSAL_TITLES),
      description:    `Description de la proposition de formation ${i + 1}.`,
      career:         pick(CAREERS_LIST),
      targetAudience: pick(AUDIENCES),
      justification:  chance(0.7) ? `Justification de la proposition ${i + 1}.` : undefined,
      status:         pick(['pending', 'accepted', 'rejected']),
      createdAt:      daysAgo(rnd(200)),
    });
    proposalCount++;
  }
  console.log(`✅ ${proposalCount} propositions de formation créées`);

  // ── 19. Cohorte « formation terminée » ───────────────────────────
  // 15 candidats connus (candidate0..14) qui ONT TERMINÉ leur formation
  // et demandent un NOUVEAU programme → permet de tester :
  //   • le choix d'un autre programme par le candidat,
  //   • la validation de ces demandes par l'admin (page Validation).
  const onlineTrainings = trainings.filter((p: any) => p.online);
  let finishedCount = 0;
  for (let i = 0; i < 15; i++) {
    const cand = candidates[i];
    const finishedTraining = onlineTrainings[i % onlineTrainings.length];
    const nextTraining     = onlineTrainings[(i + 1) % onlineTrainings.length];

    // Inscription TERMINÉE sur le 1er programme.
    const finishedIns = await Inscription.create({
      user: cand._id,
      trainings: [finishedTraining._id],
      mentor: mentors[i % 19]._id,
      status: 'completed',
      closed: true,
      createdAt: daysAgo(120),
    });

    // Toutes ses réponses de tâches passées en « Closed » (statut 3).
    const cohortTasks = pickN(trainingTasks, 4);
    for (const t of cohortTasks) {
      t.responses = t.responses || [];
      (t.responses as any).push({
        owner: cand._id, inscription: finishedIns._id,
        status: 3, createdAt: daysAgo(40 + rnd(60)),
      });
      await t.save();
    }

    // Nouvelle inscription (pour le programme choisi) + demande EN ATTENTE.
    const newIns = await Inscription.create({
      user: cand._id,
      trainings: [nextTraining._id],
      status: 'active',
      createdAt: daysAgo(rnd(5)),
    });
    await TrainingRequest.create({
      user: cand._id,
      training: nextTraining._id,
      inscription: newIns._id,
      status: 'pending',          // ← l'admin doit valider
    });
    finishedCount++;
  }
  console.log(`✅ ${finishedCount} candidats « formation terminée » + ${finishedCount} demandes EN ATTENTE de validation admin`);

  // ── Récapitulatif ─────────────────────────────────────────────────
  console.log('\n🎉 Seed de stress terminé !');
  console.log('─────────────────────────────────────────');
  console.log(`   Candidats     : ${candidates.length}`);
  console.log(`   Entreprises   : ${companies.length}  | Mentors : ${mentors.length}`);
  console.log(`   Programmes    : ${trainings.length}  | Documentations : ${documentations.length}`);
  console.log(`   Offres        : ${jobOffers.length}  | Candidatures : ${applications.length}`);
  console.log(`   Entretiens    : ${itvCount}`);
  console.log(`   Inscriptions  : ${inscriptions.length}`);
  console.log(`   Tâches        : ${trainingTasks.length} (prog) + ${tasks.length} (standalone)  | Réponses : ${progTrCount} (prog) + ${trCount} (standalone)`);
  console.log(`   Conversations : ${convCount}  | Messages : ${msgCount}`);
  console.log(`   Notifications : ${notifCount}  | Évaluations : ${evalCount}`);
  console.log(`   TrainingRequest: ${reqCount + finishedCount} (dont ${finishedCount} EN ATTENTE)`);
  console.log(`   Propositions   : ${proposalCount}`);
  console.log(`   Formation terminée : ${finishedCount} candidats (candidate0..14)`);
  console.log('─────────────────────────────────────────');
  console.log('🔑 admin@shape.fr / Admin2025!');
  console.log('🔑 company0@shape-test.com / Shape2025!');
  console.log('🔑 mentor0@shape-test.com / Shape2025!');
  console.log('🔑 candidate0@shape-test.com / Shape2025!');

  await mongoose.disconnect();
}

seed().catch(err => { console.error('❌ Seed stress error:', err); process.exit(1); });
