import mongoose from 'mongoose';
import bcrypt    from 'bcryptjs';
import dotenv    from 'dotenv';
dotenv.config();

import User                from './models/User';
import Company             from './models/Company';
import JobOffer            from './models/JobOffer';
import JobOfferApplication from './models/JobOfferApplication';
import Interview           from './models/Interview';

const COMPANY_USER_ID  = '69ea668044e48949bcfffce8';
const COMPANY_ID       = '69ea668044e48949bcfffcee';

// Hard skills IDs existants
const SK_SEO      = '69ea668044e48949bcfffc8d';
const SK_SEA      = '69ea668044e48949bcfffc8e';
const SK_CONTENT  = '69ea668044e48949bcfffc92';
const SK_SOCIAL   = '69ea668044e48949bcfffc95';
const SK_EMAIL    = '69ea668044e48949bcfffc91';
// Software skills IDs existants
const SW_CANVA    = '69ea668044e48949bcfffca1';
const SW_PS       = '69ea668044e48949bcfffca2';
const SW_HOOTSUITE = '69ea668044e48949bcfffca6';
// Job offer model
const JOM_CDI     = '69ea668044e48949bcfffcca';

async function seed() {
  await mongoose.connect(process.env.MONGO_URI!);
  console.log('✅ MongoDB connecté');

  // ── 1. Créer les offres d'emploi (si elles n'existent pas déjà) ──
  let offer1 = await JobOffer.findOne({ _testData: true, title: 'Responsable Marketing Digital' } as any);
  if (!offer1) {
    offer1 = await JobOffer.create({
      company:         COMPANY_ID,
      jobOfferModel:   JOM_CDI,
      title:           'Responsable Marketing Digital',
      description:     'Nous recherchons un 3 en marketing digital pour piloter notre stratégie SEO, SEA et Social Media.',
      whoAreThey:      'Une startup en forte croissance dans le secteur des médias digitaux.',
      requiredProfile: 'Minimum 2 ans d\'expérience en marketing digital, maîtrise des outils SEO et Google Ads.',
      status:          'open',
      hardSkills: [
        { skill: SK_SEO,     level: '3' },
        { skill: SK_SEA,     level: '2' },
        { skill: SK_CONTENT, level: '2' },
        { skill: SK_SOCIAL,  level: '2' },
      ],
      softwareSkills: [
        { skill: SW_CANVA,     level: '2' },
        { skill: SW_HOOTSUITE, level: '1' },
      ],
      _testData: true,
    } as any);
    console.log(`📋 Offre créée : "${offer1.title}"`);
  } else {
    console.log(`⏭️  Offre déjà existante : "${offer1.title}"`);
  }

  let offer2 = await JobOffer.findOne({ _testData: true, title: 'Community Manager' } as any);
  if (!offer2) {
    offer2 = await JobOffer.create({
      company:         COMPANY_ID,
      jobOfferModel:   JOM_CDI,
      title:           'Community Manager',
      description:     'Gérer les réseaux sociaux de nos marques, créer du contenu engageant et animer les communautés en ligne.',
      whoAreThey:      'Agence de communication digitale multi-marques.',
      requiredProfile: 'Passionné(e) par les réseaux sociaux, créatif(ve), maîtrise de Canva et Adobe.',
      status:          'open',
      hardSkills: [
        { skill: SK_SOCIAL,  level: '3' },
        { skill: SK_CONTENT, level: '2' },
        { skill: SK_EMAIL,   level: '1' },
      ],
      softwareSkills: [
        { skill: SW_CANVA, level: '3' },
        { skill: SW_PS,    level: '2' },
      ],
      _testData: true,
    } as any);
    console.log(`📋 Offre créée : "${offer2.title}"`);
  } else {
    console.log(`⏭️  Offre déjà existante : "${offer2.title}"`);
  }

  // ── 2. Créer les candidats (si ils n'existent pas déjà) ──────
  const candidatesData = [
    {
      email: 'amira.benali@shape-test.fr', login: 'amira.benali',
      firstName: { fr: 'Amira',   en: 'Amira'   },
      lastName:  { fr: 'Benali',  en: 'Benali'  },
      phoneNumber: '+213 555 001 001',
      hardSkills:  [{ skill: SK_SEO, level: '3' }, { skill: SK_SEA, level: '3' }, { skill: SK_CONTENT, level: '2' }],
      softwares:   [{ skill: SW_CANVA, level: '2' }, { skill: SW_HOOTSUITE, level: '2' }],
    },
    {
      email: 'karim.meziane@shape-test.fr', login: 'karim.meziane',
      firstName: { fr: 'Karim',   en: 'Karim'   },
      lastName:  { fr: 'Meziane', en: 'Meziane' },
      phoneNumber: '+213 555 002 002',
      hardSkills:  [{ skill: SK_SOCIAL, level: '3' }, { skill: SK_CONTENT, level: '3' }, { skill: SK_EMAIL, level: '2' }],
      softwares:   [{ skill: SW_CANVA, level: '3' }, { skill: SW_PS, level: '2' }],
    },
    {
      email: 'lina.cherif@shape-test.fr', login: 'lina.cherif',
      firstName: { fr: 'Lina',   en: 'Lina'   },
      lastName:  { fr: 'Cherif', en: 'Cherif' },
      phoneNumber: '+213 555 003 003',
      hardSkills:  [{ skill: SK_SEO, level: '2' }, { skill: SK_CONTENT, level: '1' }],
      softwares:   [{ skill: SW_CANVA, level: '1' }],
    },
    {
      email: 'yacine.hamdi@shape-test.fr', login: 'yacine.hamdi',
      firstName: { fr: 'Yacine', en: 'Yacine' },
      lastName:  { fr: 'Hamdi',  en: 'Hamdi'  },
      phoneNumber: '+213 555 004 004',
      hardSkills:  [{ skill: SK_SEA, level: '2' }, { skill: SK_EMAIL, level: '2' }, { skill: SK_SOCIAL, level: '1' }],
      softwares:   [{ skill: SW_HOOTSUITE, level: '1' }],
    },
    {
      email: 'sarah.ouali@shape-test.fr', login: 'sarah.ouali',
      firstName: { fr: 'Sarah', en: 'Sarah' },
      lastName:  { fr: 'Ouali', en: 'Ouali' },
      phoneNumber: '+213 555 005 005',
      hardSkills:  [{ skill: SK_SOCIAL, level: '3' }, { skill: SK_SEO, level: '2' }, { skill: SK_CONTENT, level: '3' }, { skill: SK_EMAIL, level: '2' }],
      softwares:   [{ skill: SW_CANVA, level: '3' }, { skill: SW_PS, level: '3' }, { skill: SW_HOOTSUITE, level: '2' }],
    },
  ];

  const password = await bcrypt.hash('Candidat2025!', 10);
  const users: any[] = [];
  let created = 0;

  for (const c of candidatesData) {
    let u = await User.findOne({ email: c.email });
    if (!u) {
      u = await User.create({
        email:       c.email,
        login:       c.login,
        password,
        firstName:   c.firstName,
        lastName:    c.lastName,
        phoneNumber: c.phoneNumber,
        roles:       ['CANDIDATE'],
        hardSkills:  c.hardSkills,
        softwares:   c.softwares,
      });
      created++;
    }
    users.push(u);
  }
  console.log(`👤 ${created} candidat(s) créé(s), ${users.length - created} déjà existant(s)`);

  // ── 3. Créer les candidatures (si elles n'existent pas déjà) ─
  const applicationsData = [
    { user: users[0], offer: offer1, score: 87, skillScore: 0.85, semanticScore: 0.88,
      matchedSkills: ['SEO', 'SEA', 'Content Marketing', 'Canva', 'Hootsuite'],
      missingSkills: ['Social Media Marketing'], status: 1 },

    { user: users[1], offer: offer1, score: 72, skillScore: 0.70, semanticScore: 0.73,
      matchedSkills: ['Social Media Marketing', 'Content Marketing', 'Canva'],
      missingSkills: ['SEO', 'SEA', 'Hootsuite'], status: 1 },

    { user: users[2], offer: offer1, score: 45, skillScore: 0.40, semanticScore: 0.48,
      matchedSkills: ['SEO', 'Content Marketing'],
      missingSkills: ['SEA', 'Social Media Marketing', 'Canva'], status: 2 },

    { user: users[3], offer: offer1, score: 58, skillScore: 0.55, semanticScore: 0.60,
      matchedSkills: ['SEA', 'Email Marketing'],
      missingSkills: ['SEO', 'Content Marketing', 'Hootsuite'], status: 2 },

    { user: users[4], offer: offer1, score: 94, skillScore: 0.93, semanticScore: 0.95,
      matchedSkills: ['Social Media Marketing', 'SEO', 'Content Marketing', 'Email Marketing', 'Canva', 'Hootsuite'],
      missingSkills: [], status: 3,
      confirmedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() },

    { user: users[1], offer: offer2, score: 91, skillScore: 0.90, semanticScore: 0.92,
      matchedSkills: ['Social Media Marketing', 'Content Marketing', 'Email Marketing', 'Canva', 'Adobe Photoshop'],
      missingSkills: [], status: 1 },

    { user: users[4], offer: offer2, score: 88, skillScore: 0.87, semanticScore: 0.89,
      matchedSkills: ['Social Media Marketing', 'Content Marketing', 'Canva', 'Adobe Photoshop'],
      missingSkills: ['Email Marketing'], status: 1 },

    { user: users[0], offer: offer2, score: 62, skillScore: 0.58, semanticScore: 0.65,
      matchedSkills: ['Content Marketing', 'Canva'],
      missingSkills: ['Social Media Marketing', 'Adobe Photoshop'], status: 2 },
  ];

  let appCreated = 0;
  const createdApps: any[] = [];

  for (const a of applicationsData) {
    let app = await JobOfferApplication.findOne({ user: a.user._id, jobOffer: a.offer._id });
    if (!app) {
      const proposedDate = a.status === 1
        ? new Date(Date.now() + (3 + Math.floor(Math.random() * 7)) * 24 * 60 * 60 * 1000)
        : undefined;
      app = await JobOfferApplication.create({
        user:              a.user._id,
        jobOffer:          a.offer._id,
        status:            a.status,
        matchScore:        a.score,
        skillScore:        a.skillScore,
        semanticScore:     a.semanticScore,
        matchedSkills:     a.matchedSkills,
        missingSkills:     a.missingSkills,
        extractedCvSkills: a.matchedSkills,
        coverLetter:       `Je suis très motivé(e) pour rejoindre votre équipe.`,
        proposedDate,
        confirmedDate:     (a as any).confirmedDate,
        _testData:         true,
      } as any);
      appCreated++;
    }
    if (a.status === 3) createdApps.push(app);
  }
  console.log(`📨 ${appCreated} candidature(s) créée(s)`);

  // ── 4. Créer les entretiens (si ils n'existent pas déjà) ─────
  let interviewCreated = 0;
  for (const app of createdApps) {
    const exists = await Interview.findOne({ applicationId: app._id });
    if (!exists) {
      const scheduledAt = (app as any).confirmedDate
        ? new Date((app as any).confirmedDate)
        : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

      await Interview.create({
        applicationId: app._id,
        companyId:     COMPANY_ID,
        candidateId:   app.user,
        jobOfferId:    app.jobOffer,
        scheduledAt,
        channelName:   `shape-${app._id}-${Date.now()}`,
        status:        'scheduled',
      });
      interviewCreated++;
    }
  }
  console.log(`📅 ${interviewCreated} entretien(s) créé(s)`);
  console.log('\n✅ Seed terminé !\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Compte entreprise  : rh@mediaspark.fr / Shape2025!');
  console.log('  Offres créées      : Marketing Digital, Community Manager');
  console.log('  Candidats créés    : 5 (mot de passe : Candidat2025!)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
