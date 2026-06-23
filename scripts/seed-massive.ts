/**
 * seed-massive.ts — Jeu de données MASSIF pour stresser l'app jusqu'a ses limites.
 *
 *  Volumes (configurables via SEED_*) :
 *    - Candidats               : 1 000     (vs 500 dans le json initial)
 *    - Mentors                 : 80
 *    - Entreprises             : 120
 *    - Admins                  : 3
 *    - Offres d'emploi         : 500       (vs 300)
 *    - Candidatures            : 6 000     (vs 3 000) — tous statuts 0..5
 *    - Entretiens              : 2 000     (vs 1 200)
 *    - Programmes              : 200       (vs 100)
 *    - Inscriptions            : 1 500     (vs 400)
 *    - Demandes de programme   : 2 000     (vs 1 000)
 *    - Évaluations mentor      : 1 500     (vs 800)
 *    - Tâches (autonomes)      : 800       (vs 500)
 *    - Conversations           : 3 000     (vs 1 500)
 *    - Messages                : ≈ 60 000  (vs 20 000) — 10 a 30 par conv
 *    - Notifications           : 20 000    (vs 10 000)
 *    - NotificationSettings    : 1 par user
 *    - Propositions entreprise : 250
 *    - Cohorte « formation terminee » : 30
 *
 *  Exécution : npm run seed:massive
 *  Override : SEED_CANDIDATES=2000 npm run seed:massive
 *
 *  ⚠️ Vide TOUTES les collections avant insertion.
 */
import mongoose from 'mongoose';
import bcrypt   from 'bcryptjs';
import dotenv   from 'dotenv';
dotenv.config();

import User              from '../src/models/User';
import Skill             from '../src/models/Skill';
import Career            from '../src/models/Career';
import JobOfferModel     from '../src/models/JobOfferModel';
import Training          from '../src/models/Training';
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
import TrainingRequest   from '../src/models/TrainingRequest';
import CompanyTrainingProposal from '../src/models/CompanyTrainingProposal';
import Documentation     from '../src/models/Documentation';

import { TRAINING_CATALOG, CatalogTraining } from './training-catalog';

// ── Config : surcharge par variable d'environnement ─────────────────
const num = (env: string, def: number) => Number(process.env[env] ?? def);
const CFG = {
  CANDIDATES:          num('SEED_CANDIDATES',          1000),
  MENTORS:             num('SEED_MENTORS',             80),
  COMPANIES:           num('SEED_COMPANIES',           120),
  ADMINS:              num('SEED_ADMINS',              3),
  JOB_OFFERS:          num('SEED_JOB_OFFERS',          500),
  APPLICATIONS:        num('SEED_APPLICATIONS',        6000),
  TRAININGS:           num('SEED_TRAININGS',           200),
  INSCRIPTIONS:        num('SEED_INSCRIPTIONS',        1500),
  TRAINING_REQUESTS:   num('SEED_TRAINING_REQUESTS',   2000),
  MENTOR_EVALUATIONS:  num('SEED_MENTOR_EVALUATIONS',  1500),
  STANDALONE_TASKS:    num('SEED_TASKS',               800),
  TASK_RESPONSES:      num('SEED_TASK_RESPONSES',      4000),
  QUIZ_RESPONSES:      num('SEED_QUIZ_RESPONSES',      3000),
  INTERVIEWS:          num('SEED_INTERVIEWS',          2000),
  APPOINTMENTS:        num('SEED_APPOINTMENTS',        500),
  CONVERSATIONS:       num('SEED_CONVERSATIONS',       3000),
  MIN_MSG_PER_CONV:    num('SEED_MIN_MSG',             10),
  MAX_MSG_PER_CONV:    num('SEED_MAX_MSG',             30),
  NOTIFICATIONS:       num('SEED_NOTIFICATIONS',       20000),
  COMPANY_PROPOSALS:   num('SEED_COMPANY_PROPOSALS',   250),
  FINISHED_COHORT:     num('SEED_FINISHED_COHORT',     30),
  BATCH:               num('SEED_BATCH',               1000), // taille batch insertMany
};

// ── Helpers ─────────────────────────────────────────────────────────
const rnd  = (n: number) => Math.floor(Math.random() * n);
const pick = <T>(arr: T[]): T => arr[rnd(arr.length)];
const pickN = <T>(arr: T[], n: number): T[] => {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length; i++) out.push(copy.splice(rnd(copy.length), 1)[0]);
  return out;
};
const daysAgo   = (n: number) => new Date(Date.now() - n * 86_400_000);
const daysAhead = (n: number) => new Date(Date.now() + n * 86_400_000);
const chance    = (p: number) => Math.random() < p;
const slug = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g, '');

async function insertInBatches<T>(model: any, docs: T[], label: string): Promise<any[]> {
  if (!docs.length) return [];
  const out: any[] = [];
  for (let i = 0; i < docs.length; i += CFG.BATCH) {
    const slice = docs.slice(i, i + CFG.BATCH);
    try {
      const inserted = await model.insertMany(slice, { ordered: false });
      out.push(...inserted);
    } catch (err: any) {
      // Surface l'erreur même quand insertMany continue malgré des échecs partiels
      const partial = err?.insertedDocs || err?.result?.insertedDocs || [];
      if (partial.length) out.push(...partial);
      if (out.length === 0) {
        console.error(`\n   ❌ insertMany ${label} : aucun doc inséré dans ce batch`);
        if (err?.writeErrors?.[0]) {
          console.error('   Première erreur:', err.writeErrors[0].err?.errmsg || err.writeErrors[0].errmsg || err.writeErrors[0].message);
        } else {
          console.error('   Erreur:', err?.message || err);
        }
        throw err;
      }
    }
    process.stdout.write(`\r   ↳ ${label}: ${out.length}/${docs.length}`);
  }
  process.stdout.write('\n');
  return out;
}

// ── Référentiels (noms, métiers, compétences) ───────────────────────
const FIRST_NAMES = ['Sarah','Mohamed','Leila','Thomas','Fatima','Lucas','Yasmine','Antoine','Amira','Mathieu','Rania','Kevin','Houda','Pierre','Nadia','Karim','Samira','David','Meriem','Théo','Imane','Hugo','Sonia','Walid','Inès','Ayoub','Chloé','Bilal','Manon','Omar','Camille','Sami','Julie','Nabil','Laura','Reda','Emma','Ziad','Sophie','Anis','Mehdi','Yasmin','Selim','Lina','Adam','Nour','Rayan','Aya','Ilyes','Maya','Younes','Salma','Wassim','Asma','Hamza','Dorra','Karim','Mariem','Nizar','Wiem'];
const LAST_NAMES  = ['Dubois','Amara','Mansouri','Martin','Benali','Bernard','Khelifi','Dupont','Touati','Leroy','Saidi','Moreau','Chakroun','Lambert','Bouzid','Haddad','Hadj','Richard','Trabelsi','Fontaine','Bensalem','Garnier','Cherif','Brahimi','Faure','Slimani','Roux','Othmani','Girard','Nasri','Gharbi','Ferchichi','Jaziri','Mahjoub','Rebai','Zouari','Khrouf','Mejri','Hammami','Bouaziz','Karoui','Cherni','Ayari','Belkhir','Riahi'];
const EMAIL_DOMAINS = ['gmail.com','outlook.com','yahoo.fr','hotmail.fr','proton.me','icloud.com'];
const HARD_SKILLS = ['JavaScript','TypeScript','Python','React','Angular','Vue.js','Node.js','API REST','GraphQL','SQL','NoSQL','Docker','Kubernetes','Cloud AWS','Cloud Azure','Machine Learning','Deep Learning','Data Analyse','Big Data','SEO / Référencement','Google Ads / SEA','Social Media Marketing','Marketing de contenu','Email Marketing','Community Management','Growth Hacking','UX / UI Design','Motion Design','Copywriting','E-commerce','Cybersécurité','DevOps','CI/CD','Microservices','Java','Spring Boot','PHP','Laravel','Symfony','Flutter','Swift','Kotlin'];
const SOFT_SKILLS = ['Communication','Travail en équipe','Résolution de problèmes','Autonomie','Rigueur','Adaptabilité','Esprit d\'analyse','Curiosité','Gestion du temps','Leadership','Créativité','Esprit critique','Empathie','Diplomatie','Sens du service'];
const SOFTWARES   = ['VS Code','IntelliJ IDEA','Git','GitHub','GitLab','Docker','Postman','Insomnia','MongoDB','PostgreSQL','MySQL','Redis','Figma','Adobe XD','Adobe Photoshop','Adobe Illustrator','Canva','Google Analytics','Google Search Console','SEMrush','Ahrefs','HubSpot','Mailchimp','Meta Business Suite','WordPress','Shopify','Notion','Jira','Confluence','Power BI','Tableau','Trello','Slack','Linear'];
const FOCUSED     = ['Gestion du stress','Polyvalence','Prise d\'initiative','Sens de l\'organisation','Capacité d\'adaptation','Résistance à la pression','Curiosité intellectuelle','Persévérance','Sens du détail','Esprit d\'équipe','Gestion du temps','Autonomie'];
const CAREERS     = ['Développeur Full-Stack','Développeur Front-End','Développeur Back-End','Ingénieur DevOps','Site Reliability Engineer','Data Scientist','Data Analyst','Data Engineer','UX/UI Designer','Product Designer','Community Manager','Spécialiste SEO','Growth Marketer','Traffic Manager','Chef de projet digital','Product Owner','Scrum Master','Développeur Mobile','Analyste Cybersécurité','Architecte Cloud','Tech Lead','Engineering Manager'];
const DOMAINS     = ['Développement','Marketing Digital','Data & IA','Design','Cloud & DevOps','Cybersécurité','E-commerce','Produit'];
const TRAINING_TITLES = ['Développement Web Full-Stack','React & TypeScript Avancé','Marketing Digital & SEO','Social Media & Community Management','Google Ads & Publicité en ligne','Data Science avec Python','Machine Learning & IA','UX/UI Design avec Figma','DevOps avec Docker & Kubernetes','Cloud Computing AWS','Cybersécurité Offensive','E-commerce & Growth Hacking','Développement Mobile Flutter','Content Marketing & Copywriting','Data Analyse & Power BI','Java & Spring Boot','Microservices & API Gateway','Architecture Cloud Azure','Gestion de Produit Digital','Scrum & Agilité'];
const COMPANY_NAMES = ['Capgemini','Sopra Steria','Atos','OVHcloud','Devoteam','Talan','Orange Business','Thales Digital','Vermeg','Telnet','Proxym Group','Sofrecom','InstaDeep','Expensya','Wevioo','Linedata','Vneuron','Cynapsys','Sagemcom','Actia Engineering','BIAT Tech','Softeam','Wimobi','Focus Corporation','GFI Tunisie','Cellenza','Octo Technology','Xebia','BeOps','Datacore','BlueSquare','TechMinds','DigiNova','CodeCraft','PixelHive','CloudWise','NextGen Labs','Nexus IT','Bright Apps','Skyline Data','Quantum Pulse','GreenStack','RadarTech','Linkbridge','PrimeShift'];
const CITIES = ['Paris, La Défense','Lyon, Part-Dieu','Nantes, Île de Nantes','Toulouse, Labège','Bordeaux Métropole','Tunis, Lac 2','Sfax, Technopole','Sousse, El Kantaoui','Casablanca, Casanearshore','Rabat, Hay Riad','Alger, Bab Ezzouar','Sophia Antipolis','Lille, EuraTechnologies','Marseille, Euromed'];
const COUNTRIES = ['FR','DZ','MA','TN','BE','CA','SN','AE'];

// ── Données réelles supplémentaires pour remplir chaque champ ────────
const UNIVERSITIES = [
  'ISET Tunis','ISET Sfax','ENIT — École Nationale d\'Ingénieurs de Tunis','INSAT','SUP\'COM','ISG Tunis','IHEC Carthage','FSEG Tunis',
  'Université Paris-Saclay','Sorbonne Université','EPITECH Paris','EPITA Paris','Polytech Lyon','INSA Lyon','HEC Montréal','Université McGill',
  'Université Mohammed V Rabat','EMI Rabat','ESI Alger','USTHB Alger',
];
const STUDY_LEVELS = ['Licence', 'Licence Professionnelle', 'Master 1', 'Master 2', 'Ingénieur', 'Bachelor', 'BTS', 'Doctorat'];
const SPECIALIZATIONS = [
  'Génie Logiciel','Réseaux et Systèmes','Sciences des Données','Intelligence Artificielle','Cybersécurité',
  'Mathématiques Appliquées','Statistiques','Informatique de Gestion','Marketing Digital','Design Numérique','Multimédia','Économie',
];
const PAST_JOB_TITLES = [
  'Stagiaire Développeur','Développeur Junior','Développeur Full-Stack','Chef de projet','Consultant IT','Data Analyst Junior',
  'Web Designer','Ingénieur Étude et Développement','Assistant Marketing Digital','Community Manager Junior','SEO Specialist',
  'DevOps Engineer Junior','Mobile Developer','QA Engineer','Product Owner Junior','Tech Lead',
];
const PAST_COMPANIES = [
  'Wevioo','Talan','InstaDeep','Sofrecom','Capgemini','Sopra Steria','OVHcloud','BIAT','Attijari Bank',
  'Orange Tunisie','Tunisie Télécom','Carrefour','Vinci','Total','Renault','LinkUp','BlaBlaCar','Algolia','Datadog',
];
const PORTFOLIO_HOSTS = [
  'https://github.com', 'https://gitlab.com', 'https://www.behance.net', 'https://dribbble.com',
  'https://www.linkedin.com/in', 'https://medium.com/@', 'https://dev.to',
];
const ADDRESS_STREETS = [
  '15 rue de la République','42 avenue Habib Bourguiba','7 boulevard Mohamed V','23 rue Charles de Gaulle',
  '128 avenue de la Liberté','56 rue Ibn Khaldoun','89 boulevard du 7 Novembre','12 rue Hédi Chaker',
  '34 boulevard des Capucines','18 rue de Carthage','91 avenue Jean Jaurès','64 rue Pierre Brossolette',
];
const POSTAL_CODES_BY_CC: Record<string, string[]> = {
  FR: ['75001','75011','75019','69001','69003','13001','13008','33000','44000','59000','06000','31000'],
  TN: ['1000','1002','1053','3000','3100','4000','5000','6000','7000','8000'],
  MA: ['10000','10090','20000','20100','40000','50000','60000'],
  DZ: ['16000','31000','25000','13000'],
  BE: ['1000','2000','4000','5000','6000','9000'],
  CA: ['H2X 1V8','H3A 0G4','M5V 2T6','V6B 1A1','T2P 1B6'],
  SN: ['10000','12500','12000','40000'],
  AE: ['00000','11111','22222','33333'],
};
const COVER_LETTERS = [
  'Suite à votre annonce, je me permets de vous proposer ma candidature. Mes compétences en développement web et mon expérience récente en stage me permettent de m\'adapter rapidement à votre stack technique. Je suis particulièrement motivé par la mission décrite et l\'opportunité d\'évoluer dans un environnement dynamique.',
  'Diplômé(e) récemment, je recherche activement une opportunité me permettant de mettre en pratique mes compétences techniques tout en continuant à apprendre. Votre annonce correspond parfaitement à mes aspirations professionnelles et je serais ravi(e) d\'échanger avec vous.',
  'Passionné(e) par les enjeux du digital, je souhaite rejoindre votre équipe pour contribuer à vos projets ambitieux. Mes expériences précédentes m\'ont permis de développer une réelle autonomie, un esprit d\'analyse et une grande rigueur dans la livraison de fonctionnalités.',
  'Votre annonce a immédiatement retenu mon attention car elle correspond précisément à mon parcours et à mes ambitions. Vous trouverez en pièce jointe mon CV détaillant mes compétences techniques et mes réalisations récentes.',
];
const INTERVIEW_NOTES_RECRUITMENT = [
  'Candidat motivé, bonne présentation. Test technique réussi à 85%. Compétences techniques solides en React et Node.js.',
  'Profil junior mais très curieux et motivé. À évaluer sur un cas pratique avant décision finale.',
  'Expérience pertinente. Discussion approfondie sur l\'architecture microservices.',
  'Soft skills excellents, manque encore d\'expérience sur Kubernetes. À mettre en binôme avec un senior.',
  'Excellent fit culturel, à proposer pour la phase finale.',
  'Refus en commun accord : projet pas aligné avec ses attentes salariales.',
];
const INTERVIEW_NOTES_MENTORING = [
  'Point hebdo : le candidat avance bien sur le projet, quelques difficultés sur les hooks React. Conseils donnés.',
  'Revue du livrable de la semaine. RAS, qualité au rendez-vous. Prochain sujet : tests unitaires.',
  'Discussion sur les blockers sur le module d\'authentification JWT. Proposition d\'un ressource Udemy.',
  'Préparation du projet final : choix du sujet validé, deadline confirmée.',
  'Évaluation périodique : très bonne progression sur les soft skills.',
];
const TASK_COMMENTS = [
  'Excellent travail, livraison en avance ! Quelques suggestions pour optimiser le code.',
  'Bon début, mais attention aux conventions de nommage. Refacto attendue.',
  'Question : avez-vous testé le cas où la liste est vide ?',
  'Pensez à ajouter les tests unitaires sur les helpers, ce serait un vrai plus.',
  'Code propre, lisible. Très bonne séparation des responsabilités.',
  'Merci pour la documentation README, c\'est super utile.',
];
const COMPANY_PROFESSIONS = ['ESN','Éditeur de logiciel','Agence digitale','Cabinet de conseil','Startup','Studio créatif'];
const COMPANY_SECTORS = ['Technologies de l\'information','Conseil & Services','E-commerce','FinTech','HealthTech','EdTech','MarTech','Cybersécurité','Telecom'];
const COMPANY_HR_TITLES = ['Talent Acquisition Manager','HR Business Partner','Recruteur IT','Responsable Recrutement','People Operations Lead'];
const MENTOR_BIOS = [
  'Ancien Lead Tech chez Capgemini, j\'accompagne aujourd\'hui les développeurs en reconversion vers le full-stack moderne.',
  'Passionnée par l\'UX et le design d\'interfaces, je partage mon expérience acquise dans plusieurs scale-ups françaises.',
  'Data Scientist depuis 8 ans, je guide les apprenants dans leur premier projet de machine learning de bout en bout.',
  'Ingénieur DevOps senior, je vous accompagne sur Docker, Kubernetes et la mise en place de pipelines CI/CD robustes.',
  'Spécialiste cybersécurité offensive certifié OSCP, ancien pentester chez Orange Cyberdéfense.',
];
const STORAGE_BASE = 'https://storage.shape.app/uploads';

function realPhoneByCountry(cc: string): string {
  const prefixes: Record<string, string> = { FR: '+33', TN: '+216', MA: '+212', DZ: '+213', BE: '+32', CA: '+1', SN: '+221', AE: '+971' };
  const p = prefixes[cc] ?? '+216';
  const body = (Math.floor(Math.random() * 9_000_000_00) + 100_000_000).toString();
  return `${p} ${body.slice(0, 1)} ${body.slice(1, 3)} ${body.slice(3, 5)} ${body.slice(5, 7)} ${body.slice(7, 9)}`;
}
function realPostal(cc: string): string {
  const codes = POSTAL_CODES_BY_CC[cc] ?? POSTAL_CODES_BY_CC.TN;
  return pick(codes);
}
function realAddress(cc: string, city: string): string {
  return `${pick(ADDRESS_STREETS)}, ${realPostal(cc)} ${city.split(',')[0]}`;
}
function avatarUrl(login: string, idx: number): string {
  if (idx % 3 === 0) return `https://i.pravatar.cc/300?img=${(idx % 70) + 1}`;
  if (idx % 3 === 1) return `https://api.dicebear.com/7.x/avataaars/svg?seed=${login}`;
  return `https://api.dicebear.com/7.x/initials/svg?seed=${login}`;
}
function cvUrl(login: string): string {
  return `${STORAGE_BASE}/cv/${login}-${1000 + rnd(8999)}.pdf`;
}
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function pastJobExperiences(n: number): any[] {
  const out: any[] = [];
  let cur = daysAgo(rnd(2000) + 365);
  for (let i = 0; i < n; i++) {
    const start = cur;
    const end   = new Date(start.getTime() + (180 + rnd(900)) * 86_400_000);
    out.push({
      jobTitle:  pick(PAST_JOB_TITLES),
      company:   pick(PAST_COMPANIES),
      locale:    pick(CITIES).split(',')[0],
      startDate: isoDate(start),
      endDate:   end < new Date() ? isoDate(end) : undefined,
    });
    cur = new Date(end.getTime() + 30 * 86_400_000);
  }
  return out;
}
function academicHistory(): any[] {
  const out: any[] = [];
  const baseYear = 2014 + rnd(6);
  const undergrad = STUDY_LEVELS.filter(l => /Licence|BTS|Bachelor/.test(l));
  const grad      = STUDY_LEVELS.filter(l => /Master|Ingénieur|Doctorat/.test(l));
  out.push({
    establishment: pick(UNIVERSITIES),
    locale:        pick(CITIES).split(',')[0],
    specialization:pick(SPECIALIZATIONS),
    studyLevel:    pick(undergrad),
    startDate:     `${baseYear}-09-01`,
    endDate:       `${baseYear + 3}-06-30`,
    isStudent:     false,
  });
  if (chance(0.7)) {
    out.push({
      establishment: pick(UNIVERSITIES),
      locale:        pick(CITIES).split(',')[0],
      specialization:pick(SPECIALIZATIONS),
      studyLevel:    pick(grad),
      startDate:     `${baseYear + 3}-09-01`,
      endDate:       `${baseYear + 5}-06-30`,
      isStudent:     chance(0.1),
    });
  }
  return out;
}
function portfolioLinks(login: string): string[] {
  return pickN(PORTFOLIO_HOSTS, 1 + rnd(3)).map(h => `${h}/${login}`);
}
function notifMessage(type: string, payload: any): { msg: string; data: any } {
  switch (type) {
    case 'NEW_REGISTRATION':   return { msg: `Bienvenue sur Shape, ${payload.name} !`, data: payload };
    case 'NEW_JOB_OFFER':      return { msg: `Nouvelle offre : ${payload.title} chez ${payload.company}.`, data: payload };
    case 'NEW_APPLICATION':    return { msg: `${payload.name} a postulé à votre offre « ${payload.title} ».`, data: payload };
    case 'NEW_INTERVIEW':      return { msg: `Entretien programmé le ${payload.when}.`, data: payload };
    case 'MENTOR_TASK':        return { msg: `Nouvelle tâche assignée : ${payload.task}.`, data: payload };
    case 'MENTOR_EVALUATION':  return { msg: `Votre mentor a publié une évaluation (${payload.period}).`, data: payload };
    case 'EVALUATION_RECEIVED':return { msg: `Vous avez reçu une nouvelle évaluation (note ${payload.score}/10).`, data: payload };
    case 'EVALUATION_UPDATED': return { msg: `Votre évaluation ${payload.period} a été mise à jour.`, data: payload };
    case 'TRAINING_REQUEST':   return { msg: `Nouvelle demande de formation à valider : ${payload.training}.`, data: payload };
    default:                   return { msg: `Notification : ${type}`, data: payload };
  }
}

const usedLogins = new Set<string>();
function uniquePerson(): { firstName: string; lastName: string; login: string; email: string } {
  const firstName = pick(FIRST_NAMES);
  const lastName  = pick(LAST_NAMES);
  const base = `${slug(firstName)}.${slug(lastName)}`;
  let login = base, n = 1;
  while (usedLogins.has(login)) login = `${base}${++n}`;
  usedLogins.add(login);
  const email = `${login}@${pick(EMAIL_DOMAINS)}`;
  return { firstName, lastName, login, email };
}

async function seed() {
  console.log(`\n🚀 Seed MASSIF démarré`);
  console.log(`   Connection: ${process.env.MONGO_URI ? '(uri ok)' : '⚠️  MONGO_URI manquant'}`);
  await mongoose.connect(process.env.MONGO_URI!);
  console.log(`✅ MongoDB connecté`);

  // ── Garde-fou : ne pas detruire une DB deja peuplee ────────────────
  // Comportement par defaut idempotent : si la DB contient deja des
  // utilisateurs, on s'arrete sans rien toucher. Pour forcer le reset,
  // passer SEED_FORCE=1 (ou --force) en variable d'environnement.
  const force = process.env.SEED_FORCE === '1' || process.argv.includes('--force');
  const existing = await User.estimatedDocumentCount();
  if (existing > 0 && !force) {
    console.log(`\n⏭️  DB deja peuplee (${existing} users) — seed ignore.`);
    console.log(`   Pour reset complet : SEED_FORCE=1 npm run seed:massive`);
    await mongoose.disconnect();
    return;
  }

  const t0 = Date.now();

  // ── 1. Purge totale ────────────────────────────────────────────────
  console.log('\n🗑️  Vidage des collections…');
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
  // Collections orphelines historiques
  for (const legacy of ['programs','programrequests','companyprogramproposals','taskresponses','taskresponsecomments','quizresponses','hardskills','softwareskills','focusedskills','softskills','companies']) {
    await mongoose.connection.db!.dropCollection(legacy).catch(() => {});
  }
  console.log('   ✓ Collections vidées');

  // ── 2. Référentiels ────────────────────────────────────────────────
  console.log('\n📚 Référentiels (skills, careers, jobOfferModels)…');
  const hardSkills: any[] = await Skill.insertMany(HARD_SKILLS.map((n, i) => ({
    name: { fr: n, en: n, ...(i % 4 ? { ar: n } : {}) },
    description: { fr: `Compétence technique : ${n}.` },
    category: pick(DOMAINS), type: 'HARD',
  })));
  const softwares: any[] = await Skill.insertMany(SOFTWARES.map((n, i) => ({
    name: { fr: n, en: n, ...(i % 3 ? { ar: n } : {}) },
    description: { fr: `Outil du digital : ${n}.` },
    category: 'Outil', type: 'SOFTWARE',
  })));
  await Skill.insertMany(FOCUSED.map(n => ({
    name: { fr: n, en: n },
    description: { fr: `${n} — savoir-être valorisé en milieu professionnel.` },
    category: 'Qualité personnelle', type: 'FOCUSED',
  })));
  const softSkillRefs: any[] = await Skill.insertMany(SOFT_SKILLS.map(n => ({
    name: { fr: n, en: n },
    description: { fr: `Compétence humaine : ${n.toLowerCase()}.` },
    category: 'Compétence humaine', type: 'SOFT',
  })));
  const jobModels: any[] = await JobOfferModel.insertMany([
    { name: { fr: 'CDI',        en: 'Permanent'   } },
    { name: { fr: 'CDD',        en: 'Fixed-term'  } },
    { name: { fr: 'Stage',      en: 'Internship'  } },
    { name: { fr: 'Alternance', en: 'Apprentice'  } },
    { name: { fr: 'Freelance',  en: 'Freelance'   } },
  ]);
  await Career.insertMany(CAREERS.map(n => ({ name: { fr: n, en: n }, domain: pick(DOMAINS) })));
  console.log(`   ✓ Skills: ${hardSkills.length + softwares.length + FOCUSED.length + softSkillRefs.length} | Models: ${jobModels.length} | Careers: ${CAREERS.length}`);

  const pw      = await bcrypt.hash('Shape2025!', 10);
  const adminPw = await bcrypt.hash('Admin2025!', 10);

  // ── 3. Contenus pédagogiques (quiz, textes, vidéos, tâches) ───────
  console.log('\n📝 Contenus pédagogiques…');
  const quizzes: any[] = await Quiz.insertMany(Array.from({ length: 40 }, (_, i) => {
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
  }));
  const textBlocs: any[] = await TextBloc.insertMany(Array.from({ length: 40 }, (_, i) => {
    const topic = HARD_SKILLS[i % HARD_SKILLS.length];
    return {
      title: { fr: `Cours : ${topic}`, en: `Course: ${topic}` },
      online: true, keyWords: [topic],
      html: `<h2>${topic}</h2><p>Concepts clés et bonnes pratiques autour de ${topic}.</p>`,
    };
  }));
  const videos: any[] = await VideoYoutube.insertMany(Array.from({ length: 40 }, (_, i) => {
    const topic = HARD_SKILLS[(i + 5) % HARD_SKILLS.length];
    return {
      title: { fr: `Tutoriel : ${topic}`, en: `Tutorial: ${topic}` },
      online: true, keyWords: [topic],
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    };
  }));
  const trainingTasks: any[] = await Task.insertMany(Array.from({ length: 40 }, (_, i) => {
    const topic = HARD_SKILLS[(i + 10) % HARD_SKILLS.length];
    return {
      title: { fr: `TP : ${topic}`, en: `Lab: ${topic}` },
      description: { fr: `Mettez en pratique ${topic}.` },
      keyWords: [topic],
      online: true, deadLineInHours: 24 + rnd(96),
    };
  }));
  const documentations: any[] = await Documentation.insertMany(Array.from({ length: 12 }, (_, i) => ({
    title: { fr: `Documentation ${i + 1}`, en: `Documentation ${i + 1}` },
    description: { fr: `Ressources PDF — module ${i + 1}.` },
    keyWords: pickN(HARD_SKILLS, 3),
    online: true,
    documents: [
      { title: { fr: `Guide ${i + 1}` }, url: 'https://www.africau.edu/images/default/sample.pdf' },
    ],
  })));
  console.log(`   ✓ Quiz: ${quizzes.length} | TextBlocs: ${textBlocs.length} | Vidéos: ${videos.length} | TPs: ${trainingTasks.length} | Docs: ${documentations.length}`);

  // ── 4. Mentors ─────────────────────────────────────────────────────
  console.log(`\n🎓 Mentors x${CFG.MENTORS}…`);
  const mentorPayload = Array.from({ length: CFG.MENTORS }, (_, i) => {
    const p = uniquePerson();
    const expertise = pickN([...FOCUSED, ...CAREERS], 2 + rnd(3));
    const cc = pick(COUNTRIES);
    const city = pick(CITIES);
    return {
      login: p.login, email: p.email, password: pw,
      roles: ['MENTOR'],
      firstName: { fr: p.firstName, en: p.firstName },
      lastName:  { fr: p.lastName, en: p.lastName },
      jobTitle:  pick(CAREERS),
      gender: rnd(3),
      country: cc,
      address: realAddress(cc, city),
      postalCode: realPostal(cc),
      phoneNumber: realPhoneByCountry(cc),
      interfaceLanguage: pick(['fr', 'en']),
      avatarStorage: avatarUrl(p.login, i),
      mentorProfile: {
        expertise,
        bio: `${pick(MENTOR_BIOS)} ${5 + rnd(15)} ans d'expérience à mon actif.`,
      },
      verifiedAccount: true, createdAt: daysAgo(rnd(500)),
    };
  });
  const mentors: any[] = await insertInBatches(User, mentorPayload, 'mentors');

  // ── 5. Entreprises ────────────────────────────────────────────────
  console.log(`\n🏢 Entreprises x${CFG.COMPANIES}…`);
  const companyPayload: any[] = [];
  for (let i = 0; i < CFG.COMPANIES; i++) {
    const companyName = `${pick(COMPANY_NAMES)} ${i + 1}`;
    const cslug = `${slug(companyName)}`;
    let login = cslug, n = 1;
    while (usedLogins.has(login)) login = `${cslug}${++n}`;
    usedLogins.add(login);
    const contact = uniquePerson();
    const cc = pick(COUNTRIES);
    const city = pick(CITIES);
    companyPayload.push({
      login, email: `recrutement@${slug(companyName)}.com`, password: pw,
      roles: ['COMPANY'],
      firstName: { fr: contact.firstName, en: contact.firstName },
      lastName:  { fr: contact.lastName,  en: contact.lastName },
      jobTitle:  pick(COMPANY_HR_TITLES),
      gender: rnd(3),
      country: cc,
      address: realAddress(cc, city),
      postalCode: realPostal(cc),
      phoneNumber: realPhoneByCountry(cc),
      interfaceLanguage: pick(['fr', 'en']),
      avatarStorage: avatarUrl(contact.login, i),
      companyProfile: {
        companyName: { fr: companyName, en: companyName, ar: companyName },
        logo:        `https://logo.clearbit.com/${slug(companyName)}.com`,
        address:     { fr: realAddress(cc, city), en: realAddress(cc, city) },
        sector:      pick(COMPANY_SECTORS),
        profession:  pick(COMPANY_PROFESSIONS),
        website:     `https://www.${slug(companyName)}.com`,
      },
      verifiedAccount: i % 9 !== 0,
      deleted:         i === CFG.COMPANIES - 1,
      createdAt: daysAgo(rnd(600)),
    });
  }
  const companyUsers: any[] = await insertInBatches(User, companyPayload, 'entreprises');

  // ── 6. Candidats ──────────────────────────────────────────────────
  console.log(`\n🧑‍💻 Candidats x${CFG.CANDIDATES}…`);
  const candidatePayload = Array.from({ length: CFG.CANDIDATES }, (_, i) => {
    const p = uniquePerson();
    const cc = pick(COUNTRIES);
    const city = pick(CITIES);
    return {
      login: p.login, email: p.email, password: pw,
      roles: ['CANDIDATE'],
      firstName: { fr: p.firstName, en: p.firstName, ...(i % 5 === 0 ? { ar: p.firstName } : {}) },
      lastName:  { fr: p.lastName, en: p.lastName },
      jobTitle:  pick(CAREERS),
      gender: rnd(3),
      country: cc,
      address: realAddress(cc, city),
      postalCode: realPostal(cc),
      phoneNumber: chance(0.9) ? realPhoneByCountry(cc) : undefined,
      interfaceLanguage: pick(['fr', 'en', 'ar']),
      avatarStorage: avatarUrl(p.login, i),
      candidateProfile: {
        cvStorage:    cvUrl(p.login),
        workingMode:  pick(['Présentiel', 'Télétravail', 'Hybride']),
        languages:    pickN(['fr', 'en', 'ar', 'es', 'it', 'de'], 1 + rnd(3)),
        softSkills:   pickN(softSkillRefs, 2 + rnd(4)).map(s => ({ skill: s._id, level: 1 + rnd(5) })),
        hardSkills:   pickN(hardSkills,    2 + rnd(5)).map(s => ({ skill: s._id, level: 1 + rnd(5) })),
        softwares:    pickN(softwares,     2 + rnd(5)).map(s => ({ skill: s._id, level: 1 + rnd(5) })),
        focusedSkills:pickN(FOCUSED, 2 + rnd(3)),
        portfolioLinks: portfolioLinks(p.login),
        trainings:    pickN(TRAINING_CATALOG.map(t => t.title.fr), rnd(3)),
        professionalExperiences: chance(0.85) ? pastJobExperiences(1 + rnd(3)) : [],
        academicTrainings:       academicHistory(),
      },
      verifiedAccount: i % 9 !== 0,
      deleted:         i % 50 === 49,
      createdAt: daysAgo(rnd(600)),
    };
  });
  const candidates: any[] = await insertInBatches(User, candidatePayload, 'candidats');

  // ── 7. Admins ──────────────────────────────────────────────────────
  const adminUsers: any[] = await User.insertMany(Array.from({ length: CFG.ADMINS }, (_, i) => ({
    login: i === 0 ? 'admin' : `admin${i + 1}`,
    email: i === 0 ? 'admin@shape.fr' : `admin${i + 1}@shape.fr`,
    password: adminPw, roles: ['ADMIN'], verifiedAccount: true,
  })));
  console.log(`   ✓ Admins: ${CFG.ADMINS}`);

  // ── 8. Programmes (Training) — basés sur le CATALOGUE RÉEL ─────────
  // Stratégie :
  //   1. Pour chaque blueprint du catalogue, on insère ses Quiz & Tasks réelles UNE FOIS
  //      (curriculum + questions + énoncés issus de training-catalog.ts).
  //   2. Pour CFG.TRAININGS, on cycle sur le catalogue : chaque instance pointe
  //      sur les mêmes contenus (un quiz/task partagé peut recevoir des réponses
  //      de plusieurs cohortes — le suivi se fait par inscription).
  console.log(`\n📦 Programmes x${CFG.TRAININGS} (catalogue: ${TRAINING_CATALOG.length} blueprints réels)…`);

  // 8a. Insertion des Quiz réels du catalogue
  type BlueprintRefMap = Map<string, any>; // key = `${blueprintIdx}|${weekIdx}|${lessonIdx}` → Quiz/Task doc
  const catalogQuizMap: BlueprintRefMap = new Map();
  const catalogTaskMap: BlueprintRefMap = new Map();
  const catalogQuizPayload: any[] = [];
  const catalogTaskPayload: any[] = [];
  const quizKeys: string[] = [];
  const taskKeys: string[] = [];

  TRAINING_CATALOG.forEach((bp: CatalogTraining, bIdx: number) => {
    bp.weeks.forEach((wk, wIdx) => {
      wk.lessons.forEach((les, lIdx) => {
        if (les.kind === 'quiz') {
          quizKeys.push(`${bIdx}|${wIdx}|${lIdx}`);
          catalogQuizPayload.push({
            title: les.title,
            description: les.description,
            keyWords: les.keyWords,
            online: true,
            duration: les.durationMin,
            deadLineInHours: les.deadLineInHours,
            sections: les.sections.map(sec => ({
              text: sec.text,
              questions: sec.questions.map(q => ({
                text: q.text,
                questionType: q.questionType,
                minSelection: 1,
                maxSelection: q.questionType === 'multiple' ? q.options.filter(o => o.score > 0).length : 1,
                options: q.options,
              })),
            })),
          });
        } else if (les.kind === 'task') {
          taskKeys.push(`${bIdx}|${wIdx}|${lIdx}`);
          catalogTaskPayload.push({
            title: les.title,
            description: les.description,
            keyWords: les.keyWords,
            online: true,
            deadLineInHours: les.deadLineInHours,
          });
        }
      });
    });
  });
  const insertedCatalogQuizzes: any[] = await Quiz.insertMany(catalogQuizPayload);
  const insertedCatalogTasks:   any[] = await Task.insertMany(catalogTaskPayload);
  quizKeys.forEach((k, i) => catalogQuizMap.set(k, insertedCatalogQuizzes[i]));
  taskKeys.forEach((k, i) => catalogTaskMap.set(k, insertedCatalogTasks[i]));
  console.log(`   ✓ Quiz catalogue: ${insertedCatalogQuizzes.length}  |  Tasks catalogue: ${insertedCatalogTasks.length}`);

  // 8b. Génération des Training instances depuis le catalogue (avec sessions)
  const trainingPayload = Array.from({ length: CFG.TRAININGS }, (_, i) => {
    const bIdx = i % TRAINING_CATALOG.length;
    const bp   = TRAINING_CATALOG[bIdx];
    const sess = Math.floor(i / TRAINING_CATALOG.length) + 1;
    const total = Math.ceil(CFG.TRAININGS / TRAINING_CATALOG.length);
    const titleSuffix = total > 1 ? ` — Session ${sess}` : '';
    const online = i % 6 !== 0;
    const deadline = new Date(Date.now() + 72 * 3600_000);

    const weeks = bp.weeks.map((wk, wIdx) => ({
      title: wk.title,
      lessons: wk.lessons.map((les, lIdx) => {
        if (les.kind === 'text') {
          return { title: les.title, htmlContent: les.htmlContent, keyWords: les.keyWords };
        }
        if (les.kind === 'video') {
          return { title: les.title, videoUrl: les.videoUrl, keyWords: les.keyWords };
        }
        if (les.kind === 'doc') {
          return {
            title: les.title,
            folders: les.documents.map(d => ({
              fileName: d.title.fr,
              fileSize: 0,
              url: d.url,
            })),
            keyWords: les.keyWords,
          };
        }
        if (les.kind === 'task') {
          const t = catalogTaskMap.get(`${bIdx}|${wIdx}|${lIdx}`)!;
          return {
            title: les.title,
            learningOutcome: les.learningOutcome,
            challengeText: (les.description as any).fr,
            taskRef: t._id.toString(),
            keyWords: les.keyWords,
          };
        }
        // quiz
        const q = catalogQuizMap.get(`${bIdx}|${wIdx}|${lIdx}`)!;
        return {
          title: les.title,
          quizzes: [{
            id: q._id.toString(),
            title: les.title,
            hoursToComplete: les.durationMin,
            deadline: deadline.toISOString(),
          }],
          keyWords: les.keyWords,
        };
      }),
    }));

    return {
      title: { fr: `${bp.title.fr}${titleSuffix}`, en: `${bp.title.en}${titleSuffix}`, ar: bp.title.ar },
      description: bp.description,
      career: bp.career,
      skill: bp.domain,
      owner: mentors[i % mentors.length]._id,
      online,
      price: bp.priceTnd,
      priceEur: bp.priceEur,
      duration: bp.durationWeeks,
      weeks,
    };
  });
  const trainings: any[] = await insertInBatches(Training, trainingPayload, 'programmes');

  // 8c. Lier les Tasks du catalogue à leur premier Training propriétaire (pour Task.training / createdBy)
  // Si plusieurs sessions utilisent la même Task, on prend la première : suffisant pour les requêtes
  // GET /Task/ByAttribute/training/:id (chaque session retrouvera bien sa task via taskRef dans la leçon).
  const taskBound = new Set<string>();
  for (const prog of trainings) {
    for (const week of (prog as any).weeks || []) {
      for (const lesson of (week.lessons || []) as any[]) {
        if (lesson.taskRef && !taskBound.has(String(lesson.taskRef))) {
          await Task.findByIdAndUpdate(lesson.taskRef, { training: prog._id, createdBy: prog.owner });
          taskBound.add(String(lesson.taskRef));
        }
      }
    }
  }
  console.log(`   ✓ ${trainings.length} programmes créés (${TRAINING_CATALOG.length} formations réelles × ${Math.ceil(CFG.TRAININGS / TRAINING_CATALOG.length)} sessions)`);

  // ── 9. Offres d'emploi ─────────────────────────────────────────────
  console.log(`\n💼 Offres d'emploi x${CFG.JOB_OFFERS}…`);
  const SALARY_BASE: Record<string, [number, number]> = {
    'Junior':   [600,  1200],
    'Confirmé': [1300, 2500],
    'Senior':   [2500, 4500],
    '':         [900,  2800],
  };
  const offerPayload = Array.from({ length: CFG.JOB_OFFERS }, (_, i) => {
    const compIdx   = i < 50 ? 0 : 1 + rnd(companyUsers.length - 2);
    const role      = pick(CAREERS);
    const seniority = pick(['Junior', 'Confirmé', 'Senior', '']);
    const [sBase, sTop] = SALARY_BASE[seniority] ?? [800, 2500];
    const hasSalary = chance(0.85);
    const salaryMin = hasSalary ? sBase + rnd(sTop - sBase) : null;
    const salaryMax = hasSalary && chance(0.85) && salaryMin !== null
      ? salaryMin + 200 + rnd(800) : null;
    const cu = companyUsers[compIdx];
    const cName = cu?.companyProfile?.companyName?.fr || 'Notre entreprise';
    return {
      company: cu._id,
      jobOfferModel: pick(jobModels)._id,
      workingMode: pick(['remote', 'onsite', 'hybrid', 'freelance']),
      title: `${role} ${seniority} (H/F)`.replace(/\s+\(/, ' (').trim(),
      description: `Au sein de notre équipe ${pick(DOMAINS)}, vous interviendrez sur des projets stratégiques pour nos clients grands comptes. Vos missions principales : conception, développement, revue de code, montée en compétences sur les bonnes pratiques modernes.\n\n📋 Type de contrat : ${pick(['CDI','CDD 12 mois','Stage 6 mois','Alternance','Freelance'])}\n📍 Lieu : ${pick(CITIES)}\n💻 Télétravail : ${pick(['2 jours/semaine','3 jours/semaine','Total','Aucun'])}\n📅 Date de début : ${pick(['Immédiat','Sous 1 mois','Sous 3 mois','Flexible'])}\n🎁 Avantages : ${pick(['Ticket restaurant + mutuelle','RTT + télétravail','Stock options','Bonus annuel'])}`,
      whoAreThey: `${cName} est ${pick(['une ESN','une start-up','un éditeur de logiciel','un cabinet de conseil'])} spécialisé(e) en ${pick(DOMAINS)} avec plus de ${50 + rnd(950)} collaborateurs et des bureaux dans ${1 + rnd(5)} villes.`,
      requiredProfile: `Profil ${seniority || 'expérimenté'} maîtrisant ${pick(HARD_SKILLS)} et ${pick(HARD_SKILLS)}. Très bonnes capacités de ${pick(SOFT_SKILLS).toLowerCase()} et de ${pick(SOFT_SKILLS).toLowerCase()}. Anglais professionnel apprécié.`,
      recruitmentProcess: 'Entretien RH (30 min) → Test technique en ligne (1h30) → Entretien avec le Tech Lead → Entretien final avec le CTO.',
      profilesNeeded: 1 + rnd(4),
      softSkills: pickN(SOFT_SKILLS, 2 + rnd(3)),
      hardSkills: pickN(hardSkills, 2 + rnd(3)).map(s => ({ skill: s._id, level: 1 + rnd(5) })),
      softwareSkills: pickN(softwares, 1 + rnd(3)).map(s => ({ skill: s._id, level: 1 + rnd(5) })),
      // NOTE: `attributes` est volontairement omis : le schéma JobOffer le déclare
      // sous une forme ambigüe pour Mongoose (`type: Number` capturé comme type de champ)
      // qui le caste en `Number[]`. Tant que JobOffer.ts n'est pas corrigé en
      // `type: { type: Number }`, on intègre ces infos dans `description`.
      status: chance(0.8) ? 'open' : 'closed',
      salaryMin, salaryMax,
      createdAt: daysAgo(rnd(500)),
    };
  });
  const jobOffers: any[] = await insertInBatches(JobOffer, offerPayload, 'offres');

  // ── 10. Candidatures ──────────────────────────────────────────────
  console.log(`\n📨 Candidatures x${CFG.APPLICATIONS}…`);
  const applicationPayload: any[] = [];
  // 10a. AutoSuggested garanties pour les 10 premiers candidats sur les 50 1ères offres
  const firstOffers = jobOffers.slice(0, 50);
  for (let ci = 0; ci < Math.min(10, candidates.length); ci++) {
    for (const offer of firstOffers) {
      const matchScore = 20 + rnd(81);
      applicationPayload.push({
        user: candidates[ci]._id, jobOffer: offer._id,
        status: 0, matchScore,
        skillScore: matchScore - rnd(20), semanticScore: matchScore + rnd(15),
        matchedSkills: pickN(HARD_SKILLS, 1 + rnd(4)),
        missingSkills: pickN(HARD_SKILLS, rnd(3)),
        extractedCvSkills: pickN(HARD_SKILLS, 2 + rnd(5)),
        createdAt: daysAgo(rnd(30)),
      });
    }
  }
  // 10b. Le reste, aléatoire avec tous statuts (0..5)
  const remaining = Math.max(0, CFG.APPLICATIONS - applicationPayload.length);
  for (let i = 0; i < remaining; i++) {
    const cand  = pick(candidates);
    const offer = pick(jobOffers);
    const status = rnd(6);
    // status: 0=AutoSuggested 1=Applied 2=Rejected 3=Interview 4=Hired 5=Intern
    const isReal = status >= 1;        // candidat a vraiment postulé
    const advanced = status >= 3;      // a un entretien programmé
    const createdAt = daysAgo(rnd(500));
    applicationPayload.push({
      user: cand._id, jobOffer: offer._id,
      status,
      matchScore: rnd(101), skillScore: rnd(101), semanticScore: rnd(101),
      matchedSkills: pickN(HARD_SKILLS, rnd(4)),
      missingSkills: pickN(HARD_SKILLS, rnd(3)),
      extractedCvSkills: pickN(HARD_SKILLS, 2 + rnd(5)),
      cv:          isReal ? cvUrl(cand.login) : undefined,
      coverLetter: isReal && chance(0.7) ? pick(COVER_LETTERS) : undefined,
      proposedDate:  advanced ? daysAhead(2 + rnd(20)) : undefined,
      confirmedDate: advanced && chance(0.6) ? daysAhead(2 + rnd(20)) : undefined,
      createdAt,
    });
  }
  const applications: any[] = await insertInBatches(Application, applicationPayload, 'candidatures');

  // ── 11. Entretiens (recrutement + mentoring) ──────────────────────
  // 70% des entretiens sont liés à une candidature (recrutement), 30% sont
  // des points mentoring liés à une inscription (mentor ↔ candidat).
  console.log(`\n🎤 Entretiens x${CFG.INTERVIEWS}…`);
  const interviewPayload: any[] = [];
  const recruitmentCount = Math.floor(CFG.INTERVIEWS * 0.7);

  for (let i = 0; i < recruitmentCount; i++) {
    const app = pick(applications);
    const offer = jobOffers.find((o: any) => String(o._id) === String(app.jobOffer));
    if (!offer) continue;
    const statusRoll = rnd(3);
    const status = ['scheduled', 'completed', 'cancelled'][statusRoll];
    interviewPayload.push({
      kind: 'recruitment',
      applicationId: app._id, companyId: offer.company, candidateId: app.user,
      jobOfferId: offer._id,
      scheduledAt: status === 'scheduled' ? daysAhead(1 + rnd(30)) : daysAgo(rnd(300)),
      channelName: `shape-itv-rec-${i}`,
      status,
      confirmedByCandidate: chance(0.75),
      confirmedByCompany:   chance(0.85),
      confirmToken: `tok_${slug(String(app._id)).slice(0, 8)}_${rnd(99999)}`,
      notes: status === 'cancelled'
        ? `Annulé : ${pick(['conflit d\'agenda candidat','candidat indisponible','poste pourvu','choix du candidat pour une autre opportunité'])}.`
        : pick(INTERVIEW_NOTES_RECRUITMENT),
    });
  }
  // Mentoring : récupère les inscriptions avec mentor pour générer des points périodiques
  // Note : `inscriptions` est créé plus bas, donc on génère ici un placeholder
  //        et on ajoute les mentoring interviews APRES la création des inscriptions.
  await insertInBatches(Interview, interviewPayload, 'entretiens (recrutement)');

  // ── 12. Inscriptions ──────────────────────────────────────────────
  console.log(`\n📋 Inscriptions x${CFG.INSCRIPTIONS}…`);
  const inscriptionPayload: any[] = [];
  for (let i = 0; i < CFG.INSCRIPTIONS; i++) {
    const cand = pick(candidates);
    const withMentor = chance(0.7);
    let selectedMentor: any = undefined;
    let selectedTrainings: any[];
    if (withMentor) {
      const chosen = pick(trainings);
      selectedTrainings = [chosen._id];
      selectedMentor    = chosen.owner;
    } else {
      selectedTrainings = pickN(trainings, 1 + rnd(3)).map((p: any) => p._id);
    }
    const status = pick(['active', 'active', 'active', 'completed']);
    inscriptionPayload.push({
      user: cand._id,
      trainings: selectedTrainings,
      mentor: selectedMentor,
      status,
      closed: status === 'completed' && chance(0.7),
      createdAt: daysAgo(rnd(400)),
    });
  }
  const inscriptions: any[] = await insertInBatches(Inscription, inscriptionPayload, 'inscriptions');

  // ── 11b. Entretiens de mentoring (kind='mentoring') ───────────────
  const mentoringTarget = Math.max(0, CFG.INTERVIEWS - recruitmentCount);
  if (mentoringTarget > 0) {
    const insWithMentor = inscriptions.filter((i: any) => i.mentor);
    console.log(`\n🎤 Entretiens mentoring x${mentoringTarget}…`);
    const mentoringPayload: any[] = [];
    for (let i = 0; i < mentoringTarget && insWithMentor.length > 0; i++) {
      const ins = pick(insWithMentor);
      const statusRoll = rnd(3);
      const status = ['scheduled', 'completed', 'cancelled'][statusRoll];
      mentoringPayload.push({
        kind: 'mentoring',
        mentorId: ins.mentor, candidateId: ins.user, inscriptionId: ins._id,
        scheduledAt: status === 'scheduled' ? daysAhead(1 + rnd(15)) : daysAgo(rnd(120)),
        channelName: `shape-itv-mnt-${i}`,
        status,
        confirmedByCandidate: chance(0.8),
        confirmedByMentor:    chance(0.9),
        confirmToken: `tok_mnt_${slug(String(ins._id)).slice(0, 8)}_${rnd(99999)}`,
        notes: status === 'cancelled'
          ? `Annulé : ${pick(['mentor indisponible','candidat malade','reporté à la semaine prochaine'])}.`
          : pick(INTERVIEW_NOTES_MENTORING),
      });
    }
    await insertInBatches(Interview, mentoringPayload, 'entretiens (mentoring)');
  }

  // ── 11c. Rendez-vous mentors (kind='appointment') ────────────────
  // Créneaux d'agenda du mentor : avec ou sans stagiaire assigné, lien Zoom/Meet,
  // pas de workflow de confirmation. Remplace l'ancien modèle MentorAppointment.
  if (CFG.APPOINTMENTS > 0) {
    console.log(`\n📅 Rendez-vous mentors x${CFG.APPOINTMENTS}…`);
    const APPT_TITLES = [
      'Point hebdo coaching', 'Revue de portfolio', 'Mock interview',
      'Atelier CV', 'Préparation entretien technique', 'Code review live',
      'Bilan de mi-parcours', 'Session questions/réponses', 'Pair programming',
      'Préparation soutenance', 'Choix d\'orientation', 'Feedback projet',
    ];
    const APPT_SUBS = [
      'Discussion ouverte sur les blocages techniques.',
      'Revue détaillée + plan d\'action sur 2 semaines.',
      'Préparation aux questions comportementales.',
      'Focus sur les bonnes pratiques et la lisibilité du code.',
      '', // certains sans subtitle
    ];
    const apptPayload: any[] = [];
    for (let i = 0; i < CFG.APPOINTMENTS; i++) {
      const mentor = pick(mentors);
      // 70% avec stagiaire (parmi les inscriptions de ce mentor), 30% créneau libre
      const withIntern = chance(0.7);
      let internId: any = undefined;
      if (withIntern) {
        const mentorIns = inscriptions.filter((ins: any) => String(ins.mentor) === String(mentor._id));
        if (mentorIns.length > 0) internId = pick(mentorIns).user;
      }
      // Mix passé/futur, créneau d'1h en moyenne
      const future = chance(0.6);
      const start = future ? daysAhead(1 + rnd(30)) : daysAgo(rnd(120));
      // Recale les minutes sur 00/15/30/45 pour ressembler à un vrai planning
      start.setMinutes([0, 15, 30, 45][rnd(4)], 0, 0);
      start.setHours(8 + rnd(10)); // entre 8h et 17h
      const end = new Date(start.getTime() + (30 + rnd(4) * 30) * 60_000); // 30/60/90/120 min
      apptPayload.push({
        kind: 'appointment',
        mentorId: mentor._id,
        candidateId: internId,
        title: pick(APPT_TITLES),
        subtitle: pick(APPT_SUBS),
        scheduledAt: start,
        endAt: end,
        meetingLink: chance(0.7)
          ? pick([
              `https://meet.google.com/${slug(String(mentor._id)).slice(0, 3)}-${slug(String(i)).slice(0, 4)}-${rnd(999)}`,
              `https://zoom.us/j/${10000000 + rnd(89999999)}`,
              `https://teams.microsoft.com/l/meetup-join/${slug(String(i)).slice(0, 12)}`,
            ])
          : '',
        channelName: '',
        status: 'scheduled',
        notes: '',
        deleted: false,
      });
    }
    await insertInBatches(Interview, apptPayload, 'rendez-vous mentors');
  }

  // ── 13. Tâches autonomes + réponses ──────────────────────────────
  console.log(`\n📝 Tâches autonomes x${CFG.STANDALONE_TASKS} + réponses x${CFG.TASK_RESPONSES}…`);
  const TASK_TITLES = [
    'Refacto authentification','Audit performance Lighthouse','Migration vers TypeScript strict','POC GraphQL',
    'Tests E2E Playwright','Optimisation SQL','Mise en place CI/CD','Documentation API OpenAPI',
    'Mise en place monitoring','Sécurisation des secrets','Pair programming React Query','Étude faisabilité PWA',
  ];
  const standaloneTaskPayload = Array.from({ length: CFG.STANDALONE_TASKS }, (_, i) => {
    const mentor = pick(mentors);
    const mentorProgs = trainings.filter((p: any) => String(p.owner) === String(mentor._id));
    const prog = mentorProgs.length > 0 ? pick(mentorProgs) : pick(trainings);
    const t = pick(TASK_TITLES);
    return {
      title: { fr: `${t} #${i + 1}`, en: `${t} #${i + 1}` },
      description: {
        fr: `Objectif : ${t.toLowerCase()}. Livrables attendus : code propre, tests unitaires (>70% coverage), README mis à jour, PR avec description claire.`,
        en: `Goal: ${t.toLowerCase()}. Expected deliverables: clean code, unit tests (>70% coverage), README updated, PR with clear description.`,
      },
      keyWords: pickN(HARD_SKILLS, 2 + rnd(3)),
      online: true, deadLineInHours: 12 + rnd(160),
      createdBy: mentor._id, training: prog._id,
      documents: chance(0.6) ? [
        { name: 'consignes.pdf', url: `${STORAGE_BASE}/tasks/consignes-${i + 1}.pdf` },
        ...(chance(0.5) ? [{ name: 'starter-code.zip', url: `${STORAGE_BASE}/tasks/starter-${i + 1}.zip` }] : []),
      ] : [],
      createdAt: daysAgo(rnd(300)),
    };
  });
  const standaloneTasks: any[] = await insertInBatches(Task, standaloneTaskPayload, 'tâches');

  // Réponses aux tâches : on les ajoute par batch via bulkWrite $push
  // Chaque réponse a éventuellement des fichiers livrés + un thread de commentaires
  const allTasks = [...trainingTasks, ...standaloneTasks];
  const bulkTaskResp: any[] = [];
  for (let i = 0; i < CFG.TASK_RESPONSES; i++) {
    const t   = pick(allTasks);
    const ins = pick(inscriptions);
    const status = rnd(4); // 0=Open 1=InProgress 2=Submitted 3=Closed
    const hasFiles    = status >= 2;
    const hasComments = status >= 1;
    const filesPayload  = hasFiles ? [
      { name: 'rendu.zip', url: `${STORAGE_BASE}/responses/${slug(String(ins._id)).slice(0,8)}-${i}.zip` },
      ...(chance(0.6) ? [{ name: 'screenshot.png', url: `${STORAGE_BASE}/responses/${slug(String(ins._id)).slice(0,8)}-${i}.png` }] : []),
    ] : [];
    const commentsPayload = hasComments
      ? Array.from({ length: 1 + rnd(3) }, (_, ci) => {
          const isMentor = ci % 2 === 0;
          return {
            owner: isMentor ? (t.createdBy ?? pick(mentors)._id) : ins.user,
            user: ins.user,
            message: pick(TASK_COMMENTS),
            createdAt: daysAgo(rnd(150)),
          };
        })
      : [];
    bulkTaskResp.push({
      updateOne: {
        filter: { _id: t._id },
        update: { $push: { responses: {
          owner: ins.user, inscription: ins._id,
          status,
          files:    filesPayload,
          comments: commentsPayload,
          createdAt: daysAgo(rnd(200)),
        } } },
      },
    });
    if (bulkTaskResp.length >= CFG.BATCH) {
      await Task.bulkWrite(bulkTaskResp); bulkTaskResp.length = 0;
      process.stdout.write(`\r   ↳ réponses tâches: ${i + 1}/${CFG.TASK_RESPONSES}`);
    }
  }
  if (bulkTaskResp.length) await Task.bulkWrite(bulkTaskResp);
  process.stdout.write('\n');

  // ── 14. Réponses aux quiz ─────────────────────────────────────────
  console.log(`\n🧠 Réponses quiz x${CFG.QUIZ_RESPONSES}…`);
  const bulkQuiz: any[] = [];
  for (let i = 0; i < CFG.QUIZ_RESPONSES; i++) {
    const ins  = pick(inscriptions);
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
    bulkQuiz.push({
      updateOne: {
        filter: { _id: quiz._id },
        update: { $push: { responses: { owner: ins.user, inscription: ins._id, reponses, createdAt: daysAgo(rnd(200)) } } },
      },
    });
    if (bulkQuiz.length >= CFG.BATCH) {
      await Quiz.bulkWrite(bulkQuiz); bulkQuiz.length = 0;
      process.stdout.write(`\r   ↳ réponses quiz: ${i + 1}/${CFG.QUIZ_RESPONSES}`);
    }
  }
  if (bulkQuiz.length) await Quiz.bulkWrite(bulkQuiz);
  process.stdout.write('\n');

  // ── 15. Conversations + messages ──────────────────────────────────
  console.log(`\n💬 Conversations x${CFG.CONVERSATIONS} (messages ${CFG.MIN_MSG_PER_CONV}-${CFG.MAX_MSG_PER_CONV}/conv)…`);
  const convPayload: any[] = [];
  const convMsgPlan: { a: any; b: any; n: number }[] = [];
  for (let i = 0; i < CFG.CONVERSATIONS; i++) {
    const a = pick(candidates);
    const b = chance(0.6) ? pick(mentors) : pick(companyUsers);
    if (String(a._id) === String(b._id)) { i--; continue; }
    convPayload.push({ participants: [a._id, b._id] });
    const n = CFG.MIN_MSG_PER_CONV + rnd(Math.max(1, CFG.MAX_MSG_PER_CONV - CFG.MIN_MSG_PER_CONV));
    convMsgPlan.push({ a, b, n });
  }
  const convs: any[] = await insertInBatches(Conversation, convPayload, 'conversations');

  const msgPayload: any[] = [];
  let totalMsg = 0;
  for (let i = 0; i < convs.length; i++) {
    const c = convs[i];
    const plan = convMsgPlan[i];
    for (let j = 0; j < plan.n; j++) {
      const sender = chance(0.5) ? plan.a : plan.b;
      msgPayload.push({
        conversationId: c._id, sender: sender._id,
        content: `Message ${j} de la conversation ${i}.`,
        type: 'text', read: chance(0.6),
        createdAt: daysAgo(rnd(200)),
      });
      totalMsg++;
    }
  }
  const allMsgs: any[] = await insertInBatches(Message, msgPayload, 'messages');

  // Mettre à jour lastMessage / lastMessageAt par conversation (un seul update par conv)
  console.log('   ↳ mise à jour des conversations (lastMessage)…');
  const byConv = new Map<string, any>();
  for (const m of allMsgs) {
    const k = String(m.conversationId);
    const cur = byConv.get(k);
    if (!cur || m.createdAt > cur.createdAt) byConv.set(k, m);
  }
  // Pour chaque conversation, on calcule aussi unreadCounts par participant (Map<userId, n>)
  const unreadByConv = new Map<string, Record<string, number>>();
  for (let i = 0; i < convs.length; i++) {
    const c = convs[i];
    const k = String(c._id);
    const init: Record<string, number> = {};
    init[String(convMsgPlan[i].a._id)] = rnd(8);   // a non lus
    init[String(convMsgPlan[i].b._id)] = rnd(8);   // b non lus
    unreadByConv.set(k, init);
  }

  const convBulk: any[] = [];
  for (const [convId, m] of byConv.entries()) {
    convBulk.push({
      updateOne: {
        filter: { _id: convId },
        update: {
          lastMessage: m.content,
          lastMessageAt: m.createdAt,
          lastMessageSender: m.sender,
          unreadCounts: unreadByConv.get(convId) ?? {},
        },
      },
    });
    if (convBulk.length >= CFG.BATCH) { await Conversation.bulkWrite(convBulk); convBulk.length = 0; }
  }
  if (convBulk.length) await Conversation.bulkWrite(convBulk);
  console.log(`   ✓ ${totalMsg} messages indexés sur ${convs.length} conversations (+ unreadCounts)`);

  // ── 16. Notifications + NotificationSettings ──────────────────────
  // Chaque notification embarque un message localisé + un payload `data` réaliste
  // (références cliquables vers une offre, candidature, entretien, formation…).
  console.log(`\n🔔 Notifications x${CFG.NOTIFICATIONS}…`);
  const NOTIF_TYPES = ['NEW_REGISTRATION','NEW_JOB_OFFER','NEW_APPLICATION','NEW_INTERVIEW','MENTOR_TASK','MENTOR_EVALUATION','EVALUATION_RECEIVED','EVALUATION_UPDATED','TRAINING_REQUEST'];
  // Inclut les admins comme destinataires : ils suivent l'activite de la
  // plateforme (inscriptions, candidatures, propositions, evaluations, ...).
  const allUsers = [...candidates, ...mentors, ...companyUsers, ...adminUsers];
  const notifPayload = Array.from({ length: CFG.NOTIFICATIONS }, () => {
    const u    = pick(allUsers);
    const type = pick(NOTIF_TYPES);
    let payload: any = {};
    switch (type) {
      case 'NEW_REGISTRATION':
        payload = { name: `${u.firstName?.fr ?? ''} ${u.lastName?.fr ?? ''}`.trim() };
        break;
      case 'NEW_JOB_OFFER': {
        const o = pick(jobOffers);
        const cu = companyUsers.find((c: any) => String(c._id) === String(o.company));
        payload = { jobOfferId: o._id, title: o.title, company: cu?.companyProfile?.companyName?.fr || 'Entreprise' };
        break;
      }
      case 'NEW_APPLICATION': {
        const a = pick(applications);
        const o = jobOffers.find((j: any) => String(j._id) === String(a.jobOffer));
        const c = candidates.find((c: any) => String(c._id) === String(a.user));
        payload = { applicationId: a._id, title: o?.title, name: `${c?.firstName?.fr ?? ''} ${c?.lastName?.fr ?? ''}`.trim() };
        break;
      }
      case 'NEW_INTERVIEW':
        payload = { when: isoDate(daysAhead(1 + rnd(15))), channel: `shape-itv-${rnd(99999)}` };
        break;
      case 'MENTOR_TASK': {
        const t = pick([...trainingTasks, ...standaloneTasks]);
        payload = { taskId: t._id, task: typeof t.title === 'string' ? t.title : t.title?.fr };
        break;
      }
      case 'MENTOR_EVALUATION':
      case 'EVALUATION_UPDATED':
        payload = { period: pick(['P1','P2','P3','P4']), evaluationId: `eval_${rnd(99999)}` };
        break;
      case 'EVALUATION_RECEIVED':
        payload = { period: pick(['P1','P2','P3','P4']), score: 5 + rnd(6) };
        break;
      case 'TRAINING_REQUEST': {
        const t = pick(trainings);
        payload = { trainingId: t._id, training: t.title?.fr };
        break;
      }
    }
    const built = notifMessage(type, payload);
    return {
      userId: u._id,
      type,
      message: built.msg,
      data: built.data,
      read: chance(0.4),
      createdAt: daysAgo(rnd(180)),
    };
  });
  await insertInBatches(Notification, notifPayload, 'notifications');

  console.log(`\n🔧 NotificationSettings (1 par user)…`);
  const nsPayload = allUsers.map(u => ({
    userId: u._id,
    emailOnApply:     chance(0.85),
    emailOnStatus:    chance(0.80),
    emailOnInterview: chance(0.90),
    pushEnabled:      chance(0.35),
  }));
  await insertInBatches(NotificationSetting, nsPayload, 'paramètres');

  // ── 17. Évaluations mentor ────────────────────────────────────────
  console.log(`\n⭐ Évaluations mentor x${CFG.MENTOR_EVALUATIONS}…`);
  const insWithMentor2 = inscriptions.filter((i: any) => i.mentor);
  const EVAL_COMMENTS_POSITIVE = [
    'Très bonne progression sur l\'ensemble des modules, le candidat fait preuve d\'une grande autonomie.',
    'Excellente rigueur technique, les livrables sont propres et bien documentés. Continuez sur cette dynamique !',
    'Forte capacité d\'adaptation et bons réflexes en revue de code. Prêt(e) pour un environnement de prod.',
    'Esprit d\'équipe remarquable, sait demander de l\'aide au bon moment.',
  ];
  const EVAL_COMMENTS_NEUTRAL = [
    'Bonne base technique, à approfondir sur la partie tests unitaires et CI/CD.',
    'Quelques difficultés sur les hooks React avancés, mais bonne volonté d\'apprendre. Prévoir un module supplémentaire.',
    'Communication parfois hésitante, à travailler en mock interviews.',
  ];
  const EVAL_COMMENTS_NEGATIVE = [
    'Difficultés persistantes sur la partie back-end. Recommandation : reprendre le module Node.js depuis le début.',
    'Investissement irrégulier ces dernières semaines. Discussion à prévoir.',
  ];
  const evalPayload: any[] = [];
  for (let i = 0; i < CFG.MENTOR_EVALUATIONS && insWithMentor2.length > 0; i++) {
    const ins = pick(insWithMentor2);
    const technical = rnd(11), behavior = rnd(11), communication = rnd(11), initiative = rnd(11);
    const globalScore = Math.round((technical + behavior + communication + initiative) / 4);
    let bucket: string[];
    if (globalScore >= 7)      bucket = EVAL_COMMENTS_POSITIVE;
    else if (globalScore >= 4) bucket = EVAL_COMMENTS_NEUTRAL;
    else                       bucket = EVAL_COMMENTS_NEGATIVE;
    evalPayload.push({
      mentor: ins.mentor, intern: ins.user, inscription: ins._id,
      period: pick(['P1', 'P2', 'P3', 'P4']),
      technical, behavior, communication, initiative,
      globalScore,
      comment: pick(bucket),
    });
  }
  await insertInBatches(MentorEvaluation, evalPayload, 'évaluations');

  // ── 18. Demandes de programme (TrainingRequest) ───────────────────
  console.log(`\n📥 Demandes de programme x${CFG.TRAINING_REQUESTS}…`);
  const reqPayload: any[] = [];
  for (let i = 0; i < CFG.TRAINING_REQUESTS; i++) {
    const ins = pick(inscriptions);
    const trList = (ins as any).trainings || [];
    if (!trList.length) continue;
    reqPayload.push({
      user: ins.user,
      training: pick(trList),
      inscription: ins._id,
      status: pick(['pending', 'approved', 'rejected']),
    });
  }
  await insertInBatches(TrainingRequest, reqPayload, 'demandes');

  // ── 19. Propositions entreprise (CompanyTrainingProposal) ─────────
  console.log(`\n📨 Propositions entreprise x${CFG.COMPANY_PROPOSALS}…`);
  const PROP_TITLES = [
    'Formation React avancé pour nos équipes','Bootcamp DevOps & Kubernetes',
    'Atelier Cybersécurité OWASP','Formation Data Engineering & Spark',
    'Initiation au Cloud AWS','Bootcamp Développement Mobile Flutter',
    'Microservices & API Gateway en prod','Atelier Clean Code & Tests',
    'Kubernetes Production-ready','Bootcamp Java / Spring Boot',
    'Formation TypeScript intensive','Atelier Refactoring & Architecture Hexagonale',
  ];
  const AUDIENCES = ['Candidats juniors','Candidats confirmés','Candidats seniors','Alternants','Stagiaires','Profils en reconversion'];
  const JUSTIFICATIONS = [
    'Besoin urgent suite à la signature d\'un projet client utilisant cette stack.',
    'Pour renforcer la cellule front-end qui manque actuellement de compétences sur cette technologie.',
    'Anticipation des projets prévus pour le prochain trimestre.',
    'Demande explicite de plusieurs collaborateurs en entretiens annuels.',
    'Alignement avec la roadmap technique 2026 de l\'entreprise.',
  ];
  const propPayload = Array.from({ length: CFG.COMPANY_PROPOSALS }, () => {
    const cu = pick(companyUsers);
    const title = pick(PROP_TITLES);
    const career = pick(CAREERS);
    const audience = pick(AUDIENCES);
    return {
      company:        cu._id,
      proposedBy:     cu._id,
      title:          { fr: title, en: title },
      description:    { fr: `Notre équipe a identifié un besoin sur "${title.toLowerCase()}" : ${pick(JUSTIFICATIONS).toLowerCase()}` },
      career:         { fr: career, en: career },
      targetAudience: { fr: audience, en: audience },
      justification:  chance(0.75) ? { fr: pick(JUSTIFICATIONS) } : undefined,
      status:         pick(['pending', 'accepted', 'rejected']),
      createdAt:      daysAgo(rnd(250)),
    };
  });
  await insertInBatches(CompanyTrainingProposal, propPayload, 'propositions');

  // ── 20. Cohorte « formation terminée » ────────────────────────────
  console.log(`\n🏁 Cohorte 'formation terminée' x${CFG.FINISHED_COHORT}…`);
  const onlineTrainings = trainings.filter((p: any) => p.online);
  for (let i = 0; i < CFG.FINISHED_COHORT && i < candidates.length && onlineTrainings.length >= 2; i++) {
    const cand = candidates[i];
    const finishedTraining = onlineTrainings[i % onlineTrainings.length];
    const nextTraining     = onlineTrainings[(i + 1) % onlineTrainings.length];
    const finishedIns = await Inscription.create({
      user: cand._id,
      trainings: [finishedTraining._id],
      mentor: finishedTraining.owner,
      status: 'completed', closed: true,
      createdAt: daysAgo(150),
    });
    // 4 réponses « Closed » sur des TPs
    const tps = pickN(trainingTasks, 4);
    const tpBulk: any[] = tps.map((t: any) => ({
      updateOne: {
        filter: { _id: t._id },
        update: { $push: { responses: { owner: cand._id, inscription: finishedIns._id, status: 3, createdAt: daysAgo(40 + rnd(60)) } } },
      },
    }));
    if (tpBulk.length) await Task.bulkWrite(tpBulk);
    const newIns = await Inscription.create({
      user: cand._id,
      trainings: [nextTraining._id],
      status: 'active',
      createdAt: daysAgo(rnd(5)),
    });
    await TrainingRequest.create({
      user: cand._id, training: nextTraining._id, inscription: newIns._id,
      status: 'pending',
    });
  }

  // ── Récapitulatif ──────────────────────────────────────────────────
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  console.log('\n\n🎉 Seed massif terminé en', dt, 's');
  console.log('─────────────────────────────────────────');
  console.log(`   👤 Users         : candidats=${CFG.CANDIDATES} | mentors=${CFG.MENTORS} | entreprises=${CFG.COMPANIES} | admins=${CFG.ADMINS}`);
  console.log(`   💼 Offres        : ${CFG.JOB_OFFERS}   | candidatures : ${CFG.APPLICATIONS}`);
  console.log(`   🎤 Entretiens    : ${CFG.INTERVIEWS}  | rendez-vous mentors : ${CFG.APPOINTMENTS}`);
  console.log(`   📦 Programmes    : ${CFG.TRAININGS}   | inscriptions : ${CFG.INSCRIPTIONS}`);
  console.log(`   📥 TrainingReq   : ${CFG.TRAINING_REQUESTS}  | propositions : ${CFG.COMPANY_PROPOSALS}`);
  console.log(`   ⭐ Évaluations   : ${CFG.MENTOR_EVALUATIONS}`);
  console.log(`   📝 Tâches        : ${trainingTasks.length} (prog) + ${CFG.STANDALONE_TASKS} (autonomes) | réponses : ${CFG.TASK_RESPONSES}`);
  console.log(`   🧠 Quiz          : ${quizzes.length}  | réponses : ${CFG.QUIZ_RESPONSES}`);
  console.log(`   💬 Conversations : ${CFG.CONVERSATIONS}  | messages : ${allMsgs.length}`);
  console.log(`   🔔 Notifications : ${CFG.NOTIFICATIONS}`);
  console.log(`   🏁 Cohorte fin   : ${CFG.FINISHED_COHORT} candidats`);
  console.log('─────────────────────────────────────────');
  console.log('🔑 Comptes (mot de passe candidat/company/mentor : Shape2025!)');
  console.log('   👤 ADMIN    : admin@shape.fr / Admin2025!');
  console.log(`   🏢 COMPANY  : ${companyUsers[0]?.email}`);
  console.log(`   🎓 MENTOR   : ${mentors[0]?.email}`);
  console.log(`   🧑‍💻 CANDIDAT : ${candidates[0]?.email}`);

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('\n❌ Erreur:', err);
  process.exit(1);
});