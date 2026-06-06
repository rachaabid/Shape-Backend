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
import Skill             from '../src/models/Skill';
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

// Normalise un texte en slug (sans accents/espaces) pour login & email.
const slug = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g, '');

// Génère une identité réaliste et UNIQUE (login + email dérivés du nom).
const usedLogins = new Set<string>();
const EMAIL_DOMAINS = ['gmail.com', 'outlook.com', 'yahoo.fr', 'hotmail.fr'];
function uniquePerson(domain?: string): { firstName: string; lastName: string; login: string; email: string } {
  const firstName = pick(FIRST_NAMES);
  const lastName  = pick(LAST_NAMES);
  const base = `${slug(firstName)}.${slug(lastName)}`;
  let login = base, n = 1;
  while (usedLogins.has(login)) login = `${base}${++n}`;
  usedLogins.add(login);
  const email = `${login}@${domain ?? pick(EMAIL_DOMAINS)}`;
  return { firstName, lastName, login, email };
}

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
// Compétences techniques (HARD) — tout le digital : dev, marketing, data, design, cloud…
const HARD_SKILLS = ['JavaScript','TypeScript','Python','React','Angular','Node.js','API REST','SQL','Docker','Cloud AWS','Machine Learning','Data Analyse','Big Data','SEO / Référencement','Google Ads / SEA','Social Media Marketing','Marketing de contenu','Email Marketing','Community Management','Growth Hacking','UX / UI Design','Motion Design','Copywriting','E-commerce','Cybersécurité','DevOps'];
// Soft skills (transverses)
const SOFT_SKILLS = ['Communication','Travail en équipe','Résolution de problèmes','Autonomie','Rigueur','Adaptabilité','Esprit d\'analyse','Curiosité','Gestion du temps','Leadership','Créativité','Esprit critique'];
// Outils & logiciels (SOFTWARE) — dev, marketing, design, data…
const SOFTWARES   = ['VS Code','Git','Docker','Postman','MongoDB','PostgreSQL','Figma','Adobe XD','Adobe Photoshop','Canva','Google Analytics','Google Search Console','SEMrush','HubSpot','Mailchimp','Meta Business Suite','WordPress','Notion','Jira','Power BI','Tableau','Trello'];
// Focused skills = qualités personnelles (texte libre saisi dans le formulaire)
const FOCUSED     = ['Gestion du stress','Polyvalence','Prise d\'initiative','Sens de l\'organisation','Capacité d\'adaptation','Résistance à la pression','Curiosité intellectuelle','Persévérance','Sens du détail','Esprit d\'équipe','Gestion du temps','Autonomie'];
// Métiers du digital
const CAREERS     = ['Développeur Full-Stack','Développeur Front-End','Ingénieur DevOps','Data Scientist','Data Analyst','UX/UI Designer','Community Manager','Spécialiste SEO','Growth Marketer','Traffic Manager','Chef de projet digital','Développeur Mobile','Analyste Cybersécurité','Product Owner'];
const DOMAINS     = ['Développement','Marketing Digital','Data & IA','Design','Cloud & DevOps','Cybersécurité','E-commerce'];
// Intitulés de formations (tout le digital)
const TRAINING_TITLES = ['Développement Web Full-Stack','React & TypeScript','Marketing Digital & SEO','Social Media & Community Management','Google Ads & Publicité en ligne','Data Science avec Python','Machine Learning & IA','UX/UI Design avec Figma','DevOps avec Docker & Kubernetes','Cloud Computing AWS','Cybersécurité Offensive','E-commerce & Growth Hacking','Développement Mobile Flutter','Content Marketing & Copywriting','Data Analyse & Power BI','Java & Spring Boot'];
// Entreprises tech (FR / Maghreb) — 25 noms distincts
const COMPANY_NAMES = ['Capgemini','Sopra Steria','Atos','OVHcloud','Devoteam','Talan','Orange Business','Thales Digital','Vermeg','Telnet','Proxym Group','Sofrecom','InstaDeep','Expensya','Wevioo','Linedata','Vneuron','Cynapsys','Sagemcom','Actia Engineering','BIAT Tech','Softeam','Wimobi','Focus Corporation','GFI Tunisie'];
// Villes (sièges)
const CITIES = ['Paris, La Défense','Lyon, Part-Dieu','Nantes, Île de Nantes','Toulouse, Labège','Tunis, Lac 2','Sfax, Technopole','Casablanca, Casanearshore','Alger, Bab Ezzouar','Sophia Antipolis','Lille, EuraTechnologies'];
// Statuts de candidature : 0=AutoSuggested 1=Applied 2=Rejected 3=Interview 4=Hired 5=Intern

async function seed() {
  await mongoose.connect(process.env.MONGO_URI!);
  console.log('✅ MongoDB connecté —', process.env.MONGO_URI);

  // ── 1. Purge ──────────────────────────────────────────────────────
  await Promise.all([
    User.deleteMany({}),
    Skill.deleteMany({}), Career.deleteMany({}),
    JobOfferModel.deleteMany({}), Training.deleteMany({}), Quiz.deleteMany({}),
    TextBloc.deleteMany({}), VideoYoutube.deleteMany({}), JobOffer.deleteMany({}),
    Application.deleteMany({}), Interview.deleteMany({}), Task.deleteMany({}),
    Inscription.deleteMany({}), Conversation.deleteMany({}),
    Message.deleteMany({}), Notification.deleteMany({}), NotificationSetting.deleteMany({}),
    MentorEvaluation.deleteMany({}), TrainingRequest.deleteMany({}),
    CompanyTrainingProposal.deleteMany({}), Documentation.deleteMany({}),
  ]);
  // Supprime les anciennes collections orphelines (renommage Program → Training)
  for (const legacy of ['programs', 'programrequests', 'companyprogramproposals', 'taskresponses', 'taskresponsecomments', 'quizresponses', 'hardskills', 'softwareskills', 'focusedskills', 'softskills', 'companies']) {
    await mongoose.connection.db!.dropCollection(legacy).catch(() => {});
  }
  console.log('🗑️  Toutes les collections vidées');

  // ── 2. Référentiel ────────────────────────────────────────────────
  // Descriptions des compétences (affichées dans le back-office / profils).
  const SKILL_DESC: Record<string, string> = {
    // — Compétences techniques —
    'JavaScript': 'Langage de programmation incontournable du web, côté client et serveur.',
    'TypeScript': 'Sur-ensemble typé de JavaScript pour des applications robustes et maintenables.',
    'Python': 'Langage polyvalent très prisé en data science, IA et automatisation.',
    'React': 'Bibliothèque JavaScript pour construire des interfaces utilisateur réactives.',
    'Angular': 'Framework front-end complet pour les applications web d\'entreprise.',
    'Node.js': 'Environnement d\'exécution JavaScript côté serveur pour des API performantes.',
    'API REST': 'Conception d\'interfaces web standardisées pour l\'échange de données.',
    'SQL': 'Langage de requêtes pour manipuler les bases de données relationnelles.',
    'Docker': 'Conteneurisation des applications pour des déploiements reproductibles.',
    'Cloud AWS': 'Services cloud d\'Amazon pour héberger et faire évoluer les applications.',
    'Machine Learning': 'Conception de modèles d\'apprentissage automatique à partir de données.',
    'Data Analyse': 'Exploitation et interprétation des données pour la prise de décision.',
    'Big Data': 'Traitement et analyse de très grands volumes de données distribuées.',
    'SEO / Référencement': 'Optimisation de la visibilité d\'un site sur les moteurs de recherche.',
    'Google Ads / SEA': 'Gestion de campagnes publicitaires payantes sur les moteurs de recherche.',
    'Social Media Marketing': 'Stratégie et animation des réseaux sociaux pour une marque.',
    'Marketing de contenu': 'Création de contenus à valeur ajoutée pour attirer et fidéliser.',
    'Email Marketing': 'Conception de campagnes email et de scénarios d\'automatisation.',
    'Community Management': 'Animation et modération d\'une communauté en ligne.',
    'Growth Hacking': 'Techniques d\'acquisition et de croissance rapide pilotées par la data.',
    'UX / UI Design': 'Conception d\'expériences et d\'interfaces utilisateur ergonomiques.',
    'Motion Design': 'Création d\'animations graphiques pour le web et la vidéo.',
    'Copywriting': 'Rédaction persuasive orientée conversion.',
    'E-commerce': 'Gestion et optimisation d\'une boutique en ligne.',
    'Cybersécurité': 'Protection des systèmes et des données contre les menaces.',
    'DevOps': 'Pratiques d\'intégration et de déploiement continus (CI/CD).',
    // — Outils & logiciels —
    'VS Code': 'Éditeur de code léger et extensible, très répandu.',
    'Git': 'Système de gestion de versions pour le travail collaboratif.',
    'Postman': 'Outil de test et de documentation d\'API.',
    'MongoDB': 'Base de données NoSQL orientée documents.',
    'PostgreSQL': 'Base de données relationnelle open source robuste.',
    'Figma': 'Outil de design d\'interfaces collaboratif.',
    'Adobe XD': 'Outil de prototypage et de design d\'expérience utilisateur.',
    'Adobe Photoshop': 'Logiciel de référence pour la retouche et la création graphique.',
    'Canva': 'Outil de création graphique simple et collaboratif.',
    'Google Analytics': 'Mesure et analyse du trafic et des conversions d\'un site.',
    'Google Search Console': 'Suivi de la performance d\'un site dans la recherche Google.',
    'SEMrush': 'Suite d\'outils SEO et d\'analyse concurrentielle.',
    'HubSpot': 'Plateforme CRM et de marketing automation.',
    'Mailchimp': 'Plateforme d\'email marketing et d\'automatisation.',
    'Meta Business Suite': 'Gestion des pages et publicités Facebook / Instagram.',
    'WordPress': 'Système de gestion de contenu pour créer des sites web.',
    'Notion': 'Outil de productivité et de documentation collaborative.',
    'Jira': 'Outil de gestion de projet agile et de suivi des tickets.',
    'Power BI': 'Outil de visualisation de données et de business intelligence.',
    'Tableau': 'Plateforme de visualisation et d\'exploration de données.',
    'Trello': 'Gestion de tâches sous forme de tableaux kanban.',
  };
  const descOf = (n: string, fallback: string) => SKILL_DESC[n] ?? fallback;

  const hardSkills: any[] = await Skill.insertMany(
    HARD_SKILLS.map((n, i) => ({
      name: { fr: n, en: n, ...(i % 4 ? { ar: n } : {}) },
      description: { fr: descOf(n, `Compétence technique : ${n}.`) },
      category: pick(DOMAINS), type: 'HARD',
    })),
  );
  const softwares: any[] = await Skill.insertMany(
    SOFTWARES.map((n, i) => ({
      name: { fr: n, en: n, ...(i % 3 ? { ar: n } : {}) },
      description: { fr: descOf(n, `Outil utilisé dans le digital : ${n}.`) },
      category: 'Outil', type: 'SOFTWARE',
    })),
  );
  // Référentiel des qualités (géré dans le back-office ; côté candidat c'est du texte libre)
  await Skill.insertMany(
    FOCUSED.map(n => ({
      name: { fr: n, en: n },
      description: { fr: `${n} — savoir-être personnel valorisé en milieu professionnel.` },
      category: 'Qualité personnelle', type: 'FOCUSED',
    })),
  );
  // Référentiel des soft skills (sélection multiple + niveau côté candidat, comme hard/software)
  const softSkillRefs: any[] = await Skill.insertMany(
    SOFT_SKILLS.map(n => ({
      name: { fr: n, en: n },
      description: { fr: `Compétence humaine : ${n.toLowerCase()}.` },
      category: 'Compétence humaine', type: 'SOFT',
    })),
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
    Array.from({ length: 20 }, (_, i) => {
      const topic = TRAINING_TITLES[i % TRAINING_TITLES.length];
      return {
        title: { fr: `Quiz — ${topic}`, en: `Quiz — ${topic}` },
        online: true, duration: 10 + rnd(20), deadLineInHours: 72,
        keyWords: pickN(HARD_SKILLS, 3),
        sections: [{
          text: { fr: 'Notions fondamentales' },
          questions: [{
            text: { fr: `Quelle affirmation décrit le mieux ${topic} ?` },
            questionType: 'single',
            options: [
              { text: { fr: 'Réponse correcte' }, score: 1 },
              { text: { fr: 'Réponse incorrecte' }, score: 0 },
            ],
          }],
        }],
      };
    }),
  );
  const textBlocs: any[] = await TextBloc.insertMany(
    Array.from({ length: 20 }, (_, i) => {
      const topic = HARD_SKILLS[i % HARD_SKILLS.length];
      return {
        title: { fr: `Cours : ${topic}`, en: `Course: ${topic}` },
        online: true, keyWords: [topic],
        html: `<h2>${topic}</h2><p>Concepts clés, bonnes pratiques et exemples de code autour de ${topic}.</p>`,
      };
    }),
  );
  const videos: any[] = await VideoYoutube.insertMany(
    Array.from({ length: 20 }, (_, i) => {
      const topic = HARD_SKILLS[(i + 5) % HARD_SKILLS.length];
      return {
        title: { fr: `Tutoriel vidéo : ${topic}`, en: `Video tutorial: ${topic}` },
        online: true, keyWords: [topic],
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      };
    }),
  );

  // ── 3a. Tâches pour les programmes (créées ici pour être disponibles à l'étape 5) ──
  const trainingTasks: any[] = await Task.insertMany(
    Array.from({ length: 20 }, (_, i) => {
      const topic = HARD_SKILLS[(i + 10) % HARD_SKILLS.length];
      return {
        title: { fr: `TP : ${topic}`, en: `Lab: ${topic}` },
        description: { fr: `Mettez en pratique ${topic} : implémentez la solution et rendez votre code dans les délais.` },
        keyWords: [topic],
        online: true, deadLineInHours: 24 + rnd(96),
      };
    }),
  );
  console.log(`✅ ${trainingTasks.length} tâches-programme créées`);

  // ── 3b. Documentation (ressources PDF pour les cours) ────────────────
  const DOC_SAMPLES = [
    {
      title: { fr: 'Fondamentaux du Développement Web', en: 'Web Development Fundamentals' },
      description: { fr: 'HTML, CSS, JavaScript et les bases du web moderne.' },
      keyWords: ['HTML/CSS', 'JavaScript', 'Web'],
      online: true,
      documents: [
        { title: { fr: 'Guide HTML/CSS (PDF)' }, url: 'https://www.w3.org/WAI/WCAG21/wcag21.pdf' },
        { title: { fr: 'Aide-mémoire JavaScript' }, url: 'https://www.africau.edu/images/default/sample.pdf' },
      ],
    },
    {
      title: { fr: 'Marketing Digital & SEO', en: 'Digital Marketing & SEO' },
      description: { fr: 'Référencement naturel, Google Ads et stratégie d\'acquisition.' },
      keyWords: ['SEO', 'Marketing Digital', 'Google Ads'],
      online: true,
      documents: [
        { title: { fr: 'Checklist SEO' }, url: 'https://www.africau.edu/images/default/sample.pdf' },
        { title: { fr: 'Guide Google Analytics' }, url: 'https://www.w3.org/WAI/WCAG21/wcag21.pdf' },
      ],
    },
    {
      title: { fr: 'Data Science avec Python', en: 'Data Science with Python' },
      description: { fr: 'Analyse de données, visualisation et machine learning.' },
      keyWords: ['Python', 'Data', 'Machine Learning'],
      online: true,
      documents: [
        { title: { fr: 'Notebook d\'exemple' }, url: 'https://www.africau.edu/images/default/sample.pdf' },
      ],
    },
    {
      title: { fr: 'UX/UI Design avec Figma', en: 'UX/UI Design with Figma' },
      description: { fr: 'Concevoir des interfaces utilisateur ergonomiques et esthétiques.' },
      keyWords: ['UX/UI Design', 'Figma', 'Design'],
      online: true,
      documents: [
        { title: { fr: 'Guide des bonnes pratiques UX' }, url: 'https://www.africau.edu/images/default/sample.pdf' },
      ],
    },
    {
      title: { fr: 'DevOps & Cloud AWS', en: 'DevOps & AWS Cloud' },
      description: { fr: 'Conteneurisation, CI/CD et déploiement sur le cloud.' },
      keyWords: ['Docker', 'DevOps', 'Cloud AWS'],
      online: true,
      documents: [
        { title: { fr: 'Guide Docker' }, url: 'https://www.africau.edu/images/default/sample.pdf' },
        { title: { fr: 'Pipeline CI/CD' }, url: 'https://www.w3.org/WAI/WCAG21/wcag21.pdf' },
      ],
    },
  ];
  const documentations: any[] = await Documentation.insertMany(DOC_SAMPLES);
  console.log(`✅ ${documentations.length} documentations créées`);

  // ── 4. Mentors (créés avant les programmes pour l'assignation owner) ─
  const mentors: any[] = [];
  for (let i = 0; i < 20; i++) {
    const p = uniquePerson();
    const expertise = pickN(FOCUSED, 1 + rnd(2));
    const m = await User.create({
      login: p.login, email: p.email, password: pw,
      roles: ['MENTOR'],
      firstName: { fr: p.firstName, en: p.firstName },
      lastName:  { fr: p.lastName },
      jobTitle:  pick(CAREERS),
      mentorProfile: { expertise, bio: `Mentor spécialisé en ${expertise.join(' & ')}, ${5 + rnd(15)} ans d'expérience.` },
      verifiedAccount: true, createdAt: daysAgo(rnd(400)),
    });
    mentors.push(m);
  }
  console.log(`✅ ${mentors.length} mentors créés`);

  // ── 5. Programmes (30 — variés, chaque mentor est owner d'1-2 prog) ─
  const trainingsPayload = Array.from({ length: 30 }, (_, i) => {
    const base    = TRAINING_TITLES[i % TRAINING_TITLES.length];
    const session = i >= TRAINING_TITLES.length ? ` — Session ${Math.floor(i / TRAINING_TITLES.length) + 1}` : '';
    const title   = `${base}${session}`;
    // 1 programme sur 6 est hors-ligne ; 1 sur 8 sans contenu (cas limites).
    const online   = i % 6 !== 0;
    const hasCourses = i % 8 !== 0;
    return {
      title: { fr: title, en: title, ...(i % 3 ? { ar: title } : {}) },
      description: { fr: `Formation ${base} : objectifs, prérequis et projet fil rouge.` },
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
          // La tâche appartient à la formation, donc au mentor propriétaire.
          await Task.findByIdAndUpdate(lesson.taskRef, { training: prog._id, createdBy: prog.owner });
        }
      }
    }
  }
  console.log('✅ Tâches-programme liées à leurs programmes');

  // ── 6. Entreprises + comptes COMPANY (25, dont 1 sans offre) ──────
  const companyUsers: any[] = [];
  for (let i = 0; i < 25; i++) {
    const verified = i % 7 !== 0;            // ~1/7 non vérifiée
    const deleted  = i === 24;               // 1 entreprise supprimée (soft)
    const companyName = COMPANY_NAMES[i];
    const cslug = slug(companyName);
    let login = cslug, n = 1;
    while (usedLogins.has(login)) login = `${cslug}${++n}`;
    usedLogins.add(login);
    const contact = uniquePerson();          // représentant RH de l'entreprise
    const u = await User.create({
      login, email: `recrutement@${cslug}.com`, password: pw,
      roles: ['COMPANY'],
      firstName: { fr: contact.firstName }, lastName: { fr: contact.lastName },
      companyProfile: {
        companyName: { fr: companyName, en: companyName },
        address:     { fr: pick(CITIES) },
        sector:      'Technologies de l\'information',
        website:     `https://www.${cslug}.com`,
      },
      verifiedAccount: verified, deleted, createdAt: daysAgo(rnd(500)),
    });
    companyUsers.push(u);
  }
  console.log(`✅ ${companyUsers.length} entreprises créées`);

  // ── 7. Candidats (150 — répartition de statuts variée) ────────────
  const candidates: any[] = [];
  for (let i = 0; i < 150; i++) {
    const ctry = pick(COUNTRIES);
    // ~1/9 non vérifié, 1/30 supprimé (cas limites).
    const verified = i % 9 !== 0;
    const deleted  = i % 30 === 29;
    const p = uniquePerson();
    const c = await User.create({
      login: p.login, email: p.email, password: pw,
      roles: ['CANDIDATE'],
      firstName: { fr: p.firstName, ...(i % 4 ? { en: p.firstName } : {}) },
      lastName:  { fr: p.lastName },
      gender: rnd(3), country: ctry.code,
      phoneNumber: chance(0.8) ? `+216 ${20000000 + rnd(9999999)}` : undefined,
      interfaceLanguage: pick(['fr', 'en', 'ar']),
      candidateProfile: {
        workingMode: pick(['Présentiel', 'Télétravail', 'Hybride']),
        languages: pickN(['fr', 'en', 'ar', 'es'], 1 + rnd(3)),
        softSkills: pickN(softSkillRefs, 1 + rnd(4)).map(s => ({ skill: s._id, level: 1 + rnd(5) })),
        hardSkills: pickN(hardSkills, 1 + rnd(4)).map(s => ({ skill: s._id, level: 1 + rnd(5) })),
        softwares:  pickN(softwares,  1 + rnd(4)).map(s => ({ skill: s._id, level: 1 + rnd(5) })),
        // texte libre saisi par le candidat (qualités personnelles)
        focusedSkills: pickN(FOCUSED, 1 + rnd(3)),
      },
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
    const role = pick(CAREERS);
    const seniority = pick(['Junior', 'Confirmé', 'Senior', '']);
    const o = await JobOffer.create({
      company: companyUsers[compIdx]._id,
      jobOfferModel: pick(jobModels)._id,
      workingMode: pick(['remote', 'onsite', 'hybrid', 'freelance']),
      title: `${role} ${seniority} (H/F)`.replace(/\s+\(/, ' (').trim(),
      description: `Nous recherchons un(e) ${role} pour rejoindre nos équipes et contribuer à des projets digitaux innovants.`,
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

  // ── 12. Inscriptions (250) ────────────────────────────────────────
  // Cohérence clé : le candidat choisit une formation, et SON mentor est le
  // mentor PROPRIÉTAIRE de cette formation (training.owner). ~30 % des
  // inscriptions restent sans mentor assigné (cas « en attente de mentor »).
  const inscriptions: any[] = [];
  for (let i = 0; i < 250; i++) {
    const cand = pick(candidates);
    const withMentor = chance(0.7);
    let selectedMentor: any = undefined;
    let selectedTrainings: any[];

    if (withMentor) {
      // On choisit d'abord UNE formation, puis le mentor = son propriétaire.
      const chosen = pick(trainings);
      selectedTrainings = [chosen._id];
      selectedMentor    = chosen.owner;   // mentor propriétaire de la formation choisie
    } else {
      selectedTrainings = pickN(trainings, 1 + rnd(3)).map(p => p._id);
    }

    const ins = await Inscription.create({
      user: cand._id,
      trainings: selectedTrainings,
      mentor: selectedMentor,
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

  // ── 13b. Réponses aux quiz (imbriquées dans Quiz.responses) ───────
  // Pour un échantillon d'inscriptions, on enregistre une réponse de quiz :
  // chaque question reçoit une option (70 % la bonne → score réaliste).
  let quizRespCount = 0;
  for (const ins of pickN(inscriptions, 160)) {
    const quiz = pick(quizzes);
    const reponses: any[] = [];
    (quiz.sections || []).forEach((sec: any) =>
      (sec.questions || []).forEach((q: any) => {
        const opts = q.options || [];
        if (!opts.length) return;
        const chosen = chance(0.7)
          ? opts.reduce((best: any, o: any) => (o.score > (best?.score ?? -1) ? o : best), null)
          : pick(opts);
        reponses.push({ quizQuestion: q._id, options: [chosen._id] });
      }),
    );
    quiz.responses = quiz.responses || [];
    (quiz.responses as any).push({ owner: ins.user, inscription: ins._id, reponses, createdAt: daysAgo(rnd(180)) });
    await quiz.save();
    quizRespCount++;
  }
  console.log(`✅ ${quizRespCount} réponses aux quiz créées`);

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
  const PROPOSAL_TITLES = ['Formation React pour nos équipes','Bootcamp DevOps','Atelier Cybersécurité','Formation Data Engineering','Initiation au Cloud AWS','Bootcamp Développement Mobile','Formation Microservices','Atelier Clean Code & Tests','Formation Kubernetes','Bootcamp Java / Spring Boot'];
  const CAREERS_LIST    = ['Développeur Full-Stack','Ingénieur DevOps','Data Engineer','Analyste Cybersécurité','Développeur Mobile'];
  const AUDIENCES       = ['Candidats juniors','Candidats seniors','Alternants','Stagiaires'];
  let proposalCount = 0;
  for (let i = 0; i < 60; i++) {
    const cu = pick(companyUsers);
    await CompanyTrainingProposal.create({
      company:        cu._id,
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
  // 15 candidats (les premiers de la liste) qui ONT TERMINÉ leur formation
  // et demandent un NOUVEAU programme → permet de tester :
  //   • le choix d'un autre programme par le candidat,
  //   • la validation de ces demandes par l'admin (page Validation).
  const onlineTrainings = trainings.filter((p: any) => p.online);
  let finishedCount = 0;
  for (let i = 0; i < 15; i++) {
    const cand = candidates[i];
    const finishedTraining = onlineTrainings[i % onlineTrainings.length];
    const nextTraining     = onlineTrainings[(i + 1) % onlineTrainings.length];

    // Inscription TERMINÉE sur le 1er programme — mentor = propriétaire de la formation.
    const finishedIns = await Inscription.create({
      user: cand._id,
      trainings: [finishedTraining._id],
      mentor: finishedTraining.owner,
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
  console.log(`   Entreprises   : ${companyUsers.length}  | Mentors : ${mentors.length}`);
  console.log(`   Programmes    : ${trainings.length}  | Documentations : ${documentations.length}`);
  console.log(`   Offres        : ${jobOffers.length}  | Candidatures : ${applications.length}`);
  console.log(`   Entretiens    : ${itvCount}`);
  console.log(`   Inscriptions  : ${inscriptions.length}`);
  console.log(`   Tâches        : ${trainingTasks.length} (prog) + ${tasks.length} (standalone)  | Réponses : ${progTrCount} (prog) + ${trCount} (standalone)`);
  console.log(`   Quiz          : ${quizzes.length}  | Réponses quiz : ${quizRespCount}`);
  console.log(`   Conversations : ${convCount}  | Messages : ${msgCount}`);
  console.log(`   Notifications : ${notifCount}  | Évaluations : ${evalCount}`);
  console.log(`   TrainingRequest: ${reqCount + finishedCount} (dont ${finishedCount} EN ATTENTE)`);
  console.log(`   Propositions   : ${proposalCount}`);
  console.log(`   Formation terminée : ${finishedCount} candidats (les 15 premiers)`);
  console.log('─────────────────────────────────────────');
  console.log('🔑 Comptes de connexion (mot de passe candidat/company/mentor : Shape2025!)');
  console.log('   👤 ADMIN    : admin@shape.fr / Admin2025!');
  console.log(`   🏢 COMPANY  : ${companyUsers[0].email}`);
  console.log(`   🎓 MENTOR   : ${mentors[0].email}`);
  console.log(`   🧑‍💻 CANDIDAT : ${candidates[0].email}`);

  await mongoose.disconnect();
}

seed().catch(err => { console.error('❌ Seed stress error:', err); process.exit(1); });
