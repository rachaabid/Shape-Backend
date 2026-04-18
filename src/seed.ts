import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

import User         from './models/User';
import Company      from './models/Company';
import Language     from './models/Language';
import Country      from './models/Country';
import HardSkill    from './models/HardSkill';
import SoftwareSkill from './models/SoftwareSkill';
import FocusedSkill from './models/FocusedSkill';
import Program      from './models/Program';
import WorkingMode  from './models/WorkingMode';
import JobOfferModel from './models/JobOfferModel';
import JobOffer     from './models/JobOffer';
import Application  from './models/JobOfferApplication';
import Interview    from './models/Interview';

// ── Data ─────────────────────────────────────────────────────

const languages = [
  { name: { fr: 'Français', en: 'French',  ar: 'الفرنسية'   }, code: 'fr', flag: '🇫🇷' },
  { name: { fr: 'Anglais',  en: 'English', ar: 'الإنجليزية' }, code: 'en', flag: '🇬🇧' },
  { name: { fr: 'Arabe',    en: 'Arabic',  ar: 'العربية'    }, code: 'ar', flag: '🇹🇳' },
];

const countriesData = [
  { name: { fr: 'France',    en: 'France',        ar: 'فرنسا'        }, code: 'FR', flag: '🇫🇷' },
  { name: { fr: 'Algérie',   en: 'Algeria',       ar: 'الجزائر'      }, code: 'DZ', flag: '🇩🇿' },
  { name: { fr: 'Maroc',     en: 'Morocco',       ar: 'المغرب'       }, code: 'MA', flag: '🇲🇦' },
  { name: { fr: 'Tunisie',   en: 'Tunisia',       ar: 'تونس'         }, code: 'TN', flag: '🇹🇳' },
  { name: { fr: 'Allemagne', en: 'Germany',       ar: 'ألمانيا'      }, code: 'DE', flag: '🇩🇪' },
  { name: { fr: 'Canada',    en: 'Canada',        ar: 'كندا'         }, code: 'CA', flag: '🇨🇦' },
  { name: { fr: 'USA',       en: 'United States', ar: 'الولايات المتحدة' }, code: 'US', flag: '🇺🇸' },
  { name: { fr: 'Belgique',  en: 'Belgium',       ar: 'بلجيكا'       }, code: 'BE', flag: '🇧🇪' },
  { name: { fr: 'Suisse',    en: 'Switzerland',   ar: 'سويسرا'       }, code: 'CH', flag: '🇨🇭' },
  { name: { fr: 'Espagne',   en: 'Spain',         ar: 'إسبانيا'      }, code: 'ES', flag: '🇪🇸' },
  { name: { fr: 'Pays-Bas',  en: 'Netherlands',   ar: 'هولندا'       }, code: 'NL', flag: '🇳🇱' },
  { name: { fr: 'Italie',    en: 'Italy',         ar: 'إيطاليا'      }, code: 'IT', flag: '🇮🇹' },
];

const hardSkillsData = [
  { name: { fr: 'JavaScript',  en: 'JavaScript',  ar: 'جافاسكريبت'   }, category: 'Web' },
  { name: { fr: 'TypeScript',  en: 'TypeScript',  ar: 'تايب سكريبت'  }, category: 'Web' },
  { name: { fr: 'Python',      en: 'Python',      ar: 'بايثون'       }, category: 'Programmation' },
  { name: { fr: 'Java',        en: 'Java',        ar: 'جافا'         }, category: 'Programmation' },
  { name: { fr: 'C++',         en: 'C++',         ar: 'سي++'         }, category: 'Programmation' },
  { name: { fr: 'C#',          en: 'C#',          ar: 'سي شارب'      }, category: 'Programmation' },
  { name: { fr: 'PHP',         en: 'PHP',         ar: 'PHP'          }, category: 'Web' },
  { name: { fr: 'React',       en: 'React',       ar: 'رياكت'        }, category: 'Frontend' },
  { name: { fr: 'Angular',     en: 'Angular',     ar: 'أنجولار'      }, category: 'Frontend' },
  { name: { fr: 'Vue.js',      en: 'Vue.js',      ar: 'فيو جي إس'    }, category: 'Frontend' },
  { name: { fr: 'Node.js',     en: 'Node.js',     ar: 'نود جي إس'    }, category: 'Backend' },
  { name: { fr: 'Django',      en: 'Django',      ar: 'جانغو'        }, category: 'Backend' },
  { name: { fr: 'Spring Boot', en: 'Spring Boot', ar: 'سبرينغ بوت'   }, category: 'Backend' },
  { name: { fr: 'SQL',         en: 'SQL',         ar: 'SQL'          }, category: 'Base de données' },
  { name: { fr: 'MongoDB',     en: 'MongoDB',     ar: 'مونغو DB'     }, category: 'Base de données' },
  { name: { fr: 'PostgreSQL',  en: 'PostgreSQL',  ar: 'بوستغريSQL'   }, category: 'Base de données' },
  { name: { fr: 'Docker',      en: 'Docker',      ar: 'دوكر'         }, category: 'DevOps' },
  { name: { fr: 'Kubernetes',  en: 'Kubernetes',  ar: 'كوبيرنيتيس'   }, category: 'DevOps' },
  { name: { fr: 'AWS',         en: 'AWS',         ar: 'أمازون ويب'   }, category: 'Cloud' },
  { name: { fr: 'Azure',       en: 'Azure',       ar: 'أزور'         }, category: 'Cloud' },
  { name: { fr: 'Machine Learning', en: 'Machine Learning', ar: 'تعلم الآلة' }, category: 'IA' },
  { name: { fr: 'Deep Learning',    en: 'Deep Learning',    ar: 'التعلم العميق' }, category: 'IA' },
  { name: { fr: 'Data Analysis',    en: 'Data Analysis',    ar: 'تحليل البيانات' }, category: 'Data' },
  { name: { fr: 'Power BI',         en: 'Power BI',         ar: 'باور بي آي'    }, category: 'Data' },
  { name: { fr: 'Git',          en: 'Git',        ar: 'جيت'          }, category: 'Outils' },
  { name: { fr: 'Linux',        en: 'Linux',      ar: 'لينكس'        }, category: 'Système' },
  { name: { fr: 'REST API',     en: 'REST API',   ar: 'REST API'     }, category: 'Backend' },
  { name: { fr: 'GraphQL',      en: 'GraphQL',    ar: 'GraphQL'      }, category: 'Backend' },
  { name: { fr: 'Cybersécurité', en: 'Cybersecurity', ar: 'الأمن السيبراني' }, category: 'Sécurité' },
  { name: { fr: 'Tests unitaires', en: 'Unit Testing', ar: 'اختبارات الوحدة' }, category: 'Qualité' },
];

const softwareSkillsData = [
  { name: { fr: 'VS Code',         en: 'VS Code',         ar: 'في إس كود'    }, category: 'IDE' },
  { name: { fr: 'IntelliJ IDEA',   en: 'IntelliJ IDEA',   ar: 'إنتيليج'      }, category: 'IDE' },
  { name: { fr: 'Figma',           en: 'Figma',           ar: 'فيجما'        }, category: 'Design' },
  { name: { fr: 'Adobe XD',        en: 'Adobe XD',        ar: 'أدوبي XD'     }, category: 'Design' },
  { name: { fr: 'Photoshop',       en: 'Photoshop',       ar: 'فوتوشوب'      }, category: 'Design' },
  { name: { fr: 'Illustrator',     en: 'Illustrator',     ar: 'إليستريتور'   }, category: 'Design' },
  { name: { fr: 'Jira',            en: 'Jira',            ar: 'جيرا'         }, category: 'Gestion' },
  { name: { fr: 'Trello',          en: 'Trello',          ar: 'تريلو'        }, category: 'Gestion' },
  { name: { fr: 'Notion',          en: 'Notion',          ar: 'نوشن'         }, category: 'Gestion' },
  { name: { fr: 'Slack',           en: 'Slack',           ar: 'سلاك'         }, category: 'Communication' },
  { name: { fr: 'Microsoft Office', en: 'Microsoft Office', ar: 'مايكروسوفت أوفيس' }, category: 'Bureautique' },
  { name: { fr: 'Postman',         en: 'Postman',         ar: 'بوستمان'      }, category: 'Dev' },
  { name: { fr: 'GitHub',          en: 'GitHub',          ar: 'جيت هاب'      }, category: 'Dev' },
  { name: { fr: 'Tableau',         en: 'Tableau',         ar: 'تابلو'        }, category: 'Data' },
  { name: { fr: 'Power BI Desktop', en: 'Power BI Desktop', ar: 'باور بي آي ديسكتوب' }, category: 'Data' },
  { name: { fr: 'MySQL Workbench', en: 'MySQL Workbench', ar: 'ماي SQL'      }, category: 'Database' },
  { name: { fr: 'MongoDB Compass', en: 'MongoDB Compass', ar: 'مونغو كومباس' }, category: 'Database' },
  { name: { fr: 'Jenkins',         en: 'Jenkins',         ar: 'جنكينز'       }, category: 'CI/CD' },
  { name: { fr: 'GitLab CI',       en: 'GitLab CI',       ar: 'جيت لاب CI'   }, category: 'CI/CD' },
  { name: { fr: 'Selenium',        en: 'Selenium',        ar: 'سيلينيوم'     }, category: 'Test' },
];

const focusedSkillsData = [
  { name: { fr: 'Développement Web Full-Stack', en: 'Full-Stack Web Development', ar: 'تطوير ويب شامل' }, category: 'Web' },
  { name: { fr: 'Intelligence Artificielle',    en: 'Artificial Intelligence',    ar: 'الذكاء الاصطناعي' }, category: 'IA' },
  { name: { fr: 'Data Science',                en: 'Data Science',               ar: 'علم البيانات'    }, category: 'Data' },
  { name: { fr: 'DevOps & Cloud',              en: 'DevOps & Cloud',             ar: 'DevOps والسحابة' }, category: 'DevOps' },
  { name: { fr: 'Cybersécurité',               en: 'Cybersecurity',              ar: 'الأمن السيبراني' }, category: 'Sécurité' },
  { name: { fr: 'UX/UI Design',               en: 'UX/UI Design',               ar: 'تصميم UX/UI'    }, category: 'Design' },
  { name: { fr: 'Développement Mobile',        en: 'Mobile Development',         ar: 'تطوير الجوال'   }, category: 'Mobile' },
  { name: { fr: 'Blockchain',                  en: 'Blockchain',                 ar: 'بلوكشين'        }, category: 'Blockchain' },
  { name: { fr: 'Gestion de Projet IT',        en: 'IT Project Management',      ar: 'إدارة مشاريع IT' }, category: 'Management' },
  { name: { fr: 'Analyse de Données',          en: 'Data Analysis',              ar: 'تحليل البيانات'  }, category: 'Data' },
];

const programsData = [
  { title: { fr: 'Licence Informatique',           en: 'Computer Science Degree', ar: 'ليسانس إعلام آلي' }, career: 'Développeur logiciel', skill: 'Programmation' },
  { title: { fr: 'Master Intelligence Artificielle', en: 'AI Master',             ar: 'ماستر ذكاء اصطناعي' }, career: 'Data Scientist', skill: 'Machine Learning' },
  { title: { fr: 'Master Cybersécurité',           en: 'Cybersecurity Master',    ar: 'ماستر أمن سيبراني'  }, career: 'Ingénieur sécurité', skill: 'Cybersécurité' },
  { title: { fr: 'BTS Développement Web',          en: 'Web Development BTS',    ar: 'تقني عالي ويب'      }, career: 'Développeur Web', skill: 'JavaScript' },
  { title: { fr: 'DUT Informatique',               en: 'IT DUT',                  ar: 'دبلوم إعلام آلي'   }, career: 'Développeur', skill: 'Programmation' },
  { title: { fr: 'Formation Data Science',         en: 'Data Science Bootcamp',   ar: 'دورة علم البيانات'  }, career: 'Data Analyst', skill: 'Python' },
  { title: { fr: 'Bootcamp DevOps',                en: 'DevOps Bootcamp',         ar: 'دورة DevOps'        }, career: 'DevOps Engineer', skill: 'Docker' },
  { title: { fr: 'Licence Réseaux & Télécoms',     en: 'Networks & Telecom Degree', ar: 'ليسانس شبكات'   }, career: 'Ingénieur réseaux', skill: 'Linux' },
];

const workingModesData = [
  { name: { fr: 'Présentiel',     en: 'On-site', ar: 'حضوري'   }, description: { fr: 'Travail en entreprise', en: 'Work on-site', ar: 'عمل في المقر' } },
  { name: { fr: 'Télétravail',    en: 'Remote',  ar: 'عن بُعد'  }, description: { fr: 'Travail à distance',  en: 'Work remotely', ar: 'عمل عن بُعد' } },
  { name: { fr: 'Hybride',        en: 'Hybrid',  ar: 'هجين'    }, description: { fr: 'Mix présentiel/télétravail', en: 'Mix on-site/remote', ar: 'مزيج حضوري/عن بُعد' } },
];

const jobOfferModelsData = [
  { name: { fr: 'CDI',   en: 'Permanent Contract', ar: 'عقد دائم'   } },
  { name: { fr: 'CDD',   en: 'Fixed-term Contract', ar: 'عقد محدد المدة' } },
  { name: { fr: 'Stage', en: 'Internship',          ar: 'تدريب'     } },
  { name: { fr: 'Alternance', en: 'Apprenticeship', ar: 'تكوين متناوب' } },
  { name: { fr: 'Freelance',  en: 'Freelance',      ar: 'مستقل'     } },
  { name: { fr: 'VIE',        en: 'VIE',            ar: 'VIE'       } },
];

// ── Seed Function ─────────────────────────────────────────────

async function seed() {
  await mongoose.connect(process.env.MONGO_URI!);
  console.log('✅ MongoDB connecté');

  // Clear existing data
  await Promise.all([
    Language.deleteMany({}), Country.deleteMany({}),
    HardSkill.deleteMany({}), SoftwareSkill.deleteMany({}),
    FocusedSkill.deleteMany({}), Program.deleteMany({}),
    WorkingMode.deleteMany({}), JobOfferModel.deleteMany({}),
    JobOffer.deleteMany({}), Application.deleteMany({}),
    Interview.deleteMany({}),
  ]);
  console.log('🗑️  Collections nettoyées');

  // Insert reference data
  const [langs, insertedCountries, hardSkills, softSkills, focusedSkills, programs, workingModes, jobModels] =
    await Promise.all([
      Language.insertMany(languages),
      Country.insertMany(countriesData),
      HardSkill.insertMany(hardSkillsData),
      SoftwareSkill.insertMany(softwareSkillsData),
      FocusedSkill.insertMany(focusedSkillsData),
      Program.insertMany(programsData),
      WorkingMode.insertMany(workingModesData),
      JobOfferModel.insertMany(jobOfferModelsData),
    ]);
  console.log(`✅ Référentiel : ${langs.length} langues, ${insertedCountries.length} pays, ${hardSkills.length} hard skills, ${softSkills.length} softwares, ${focusedSkills.length} focused, ${programs.length} programmes, ${workingModes.length} modes, ${jobModels.length} contrats`);

  // Create company users
  const password = await bcrypt.hash('Shape2025!', 10);
  const companyUsers = await User.insertMany([
    { login: 'techcorp',     email: 'rh@techcorp.fr',    password, roles: ['COMPANY'], firstName: { fr: 'Sophie' }, lastName: { fr: 'Martin' },  verifiedAccount: true },
    { login: 'digitalagency', email: 'rh@digital.fr',   password, roles: ['COMPANY'], firstName: { fr: 'Julien' }, lastName: { fr: 'Dupont' }, verifiedAccount: true },
    { login: 'startupai',    email: 'hr@startupai.fr',  password, roles: ['COMPANY'], firstName: { fr: 'Emma'   }, lastName: { fr: 'Bernard'},  verifiedAccount: true },
    { login: 'datalab',      email: 'rh@datalab.fr',    password, roles: ['COMPANY'], firstName: { fr: 'Lucas'  }, lastName: { fr: 'Moreau' }, verifiedAccount: true },
    { login: 'cloudtech',    email: 'rh@cloudtech.fr',  password, roles: ['COMPANY'], firstName: { fr: 'Lea'    }, lastName: { fr: 'Petit'  }, verifiedAccount: true },
  ]);

  const companies = await Company.insertMany([
    { name: { fr: 'TechCorp',           en: 'TechCorp'           }, address: { fr: 'Paris, France'     }, owner: companyUsers[0]._id },
    { name: { fr: 'Digital Agency',     en: 'Digital Agency'     }, address: { fr: 'Lyon, France'      }, owner: companyUsers[1]._id },
    { name: { fr: 'StartupAI',          en: 'StartupAI'          }, address: { fr: 'Bordeaux, France'  }, owner: companyUsers[2]._id },
    { name: { fr: 'DataLab',            en: 'DataLab'            }, address: { fr: 'Marseille, France' }, owner: companyUsers[3]._id },
    { name: { fr: 'CloudTech Solutions', en: 'CloudTech Solutions' }, address: { fr: 'Toulouse, France' }, owner: companyUsers[4]._id },
  ]);
  console.log(`✅ ${companies.length} entreprises créées`);

  // Create candidate users
  const candidateData = [
    { login: 'alice.dev',    email: 'alice@example.com',   firstName: { fr: 'Alice'   }, lastName: { fr: 'Dubois'    }, hardSkills: [{ skill: 'JavaScript', level: 4 }, { skill: 'React', level: 4 }, { skill: 'Node.js', level: 3 }], softwares: [{ skill: 'VS Code', level: 5 }, { skill: 'GitHub', level: 4 }], softSkills: ['Communication', 'Travail en équipe'], languages: ['fr', 'en'], workingMode: 'Hybride', country: 'FR' },
    { login: 'bob.python',   email: 'bob@example.com',     firstName: { fr: 'Bob'     }, lastName: { fr: 'Rousseau'  }, hardSkills: [{ skill: 'Python', level: 5 }, { skill: 'Machine Learning', level: 4 }, { skill: 'Data Analysis', level: 4 }], softwares: [{ skill: 'Tableau', level: 3 }, { skill: 'Power BI Desktop', level: 4 }], softSkills: ['Curiosité', 'Rigueur'], languages: ['fr', 'en', 'es'], workingMode: 'Télétravail', country: 'FR' },
    { login: 'charlie.java', email: 'charlie@example.com', firstName: { fr: 'Charlie' }, lastName: { fr: 'Lefevre'   }, hardSkills: [{ skill: 'Java', level: 4 }, { skill: 'Spring Boot', level: 3 }, { skill: 'SQL', level: 4 }], softwares: [{ skill: 'IntelliJ IDEA', level: 5 }, { skill: 'Jira', level: 3 }], softSkills: ['Organisation', 'Adaptabilité'], languages: ['fr', 'en'], workingMode: 'Présentiel', country: 'FR' },
    { login: 'diana.data',   email: 'diana@example.com',   firstName: { fr: 'Diana'   }, lastName: { fr: 'Garnier'   }, hardSkills: [{ skill: 'Python', level: 4 }, { skill: 'Power BI', level: 5 }, { skill: 'SQL', level: 4 }], softwares: [{ skill: 'Power BI Desktop', level: 5 }, { skill: 'MySQL Workbench', level: 3 }], softSkills: ['Analyse', 'Présentation'], languages: ['fr', 'en', 'ar'], workingMode: 'Hybride', country: 'DZ' },
    { login: 'eve.devops',   email: 'eve@example.com',     firstName: { fr: 'Eve'     }, lastName: { fr: 'Fontaine'  }, hardSkills: [{ skill: 'Docker', level: 4 }, { skill: 'Kubernetes', level: 3 }, { skill: 'AWS', level: 4 }], softwares: [{ skill: 'Jenkins', level: 4 }, { skill: 'GitLab CI', level: 3 }], softSkills: ['Rigueur', 'Autonomie'], languages: ['fr', 'en'], workingMode: 'Télétravail', country: 'FR' },
    { login: 'frank.mobile', email: 'frank@example.com',   firstName: { fr: 'Frank'   }, lastName: { fr: 'Leclerc'   }, hardSkills: [{ skill: 'JavaScript', level: 3 }, { skill: 'React', level: 4 }, { skill: 'TypeScript', level: 3 }], softwares: [{ skill: 'Figma', level: 3 }, { skill: 'VS Code', level: 4 }], softSkills: ['Créativité', 'Communication'], languages: ['fr', 'en', 'de'], workingMode: 'Hybride', country: 'BE' },
    { login: 'grace.ai',     email: 'grace@example.com',   firstName: { fr: 'Grace'   }, lastName: { fr: 'Mercier'   }, hardSkills: [{ skill: 'Python', level: 5 }, { skill: 'Machine Learning', level: 5 }, { skill: 'Deep Learning', level: 4 }], softwares: [{ skill: 'VS Code', level: 4 }, { skill: 'GitHub', level: 4 }], softSkills: ['Recherche', 'Rigueur'], languages: ['fr', 'en', 'zh'], workingMode: 'Télétravail', country: 'CA' },
    { login: 'henry.sec',    email: 'henry@example.com',   firstName: { fr: 'Henry'   }, lastName: { fr: 'Blanchard' }, hardSkills: [{ skill: 'Cybersécurité', level: 4 }, { skill: 'Linux', level: 4 }, { skill: 'Python', level: 3 }], softwares: [{ skill: 'GitHub', level: 4 }, { skill: 'VS Code', level: 3 }], softSkills: ['Vigilance', 'Rigueur'], languages: ['fr', 'en'], workingMode: 'Présentiel', country: 'FR' },
    { login: 'iris.angular', email: 'iris@example.com',    firstName: { fr: 'Iris'    }, lastName: { fr: 'Girard'    }, hardSkills: [{ skill: 'Angular', level: 5 }, { skill: 'TypeScript', level: 4 }, { skill: 'REST API', level: 3 }], softwares: [{ skill: 'VS Code', level: 5 }, { skill: 'Postman', level: 4 }], softSkills: ['Organisation', 'Communication'], languages: ['fr', 'en', 'es'], workingMode: 'Hybride', country: 'MA' },
    { login: 'jack.cloud',   email: 'jack@example.com',    firstName: { fr: 'Jack'    }, lastName: { fr: 'Renard'    }, hardSkills: [{ skill: 'AWS', level: 5 }, { skill: 'Azure', level: 3 }, { skill: 'Docker', level: 4 }], softwares: [{ skill: 'Jenkins', level: 3 }, { skill: 'GitHub', level: 5 }], softSkills: ['Adaptabilité', 'Leadership'], languages: ['fr', 'en'], workingMode: 'Télétravail', country: 'CH' },
  ];

  const candidates = await User.insertMany(
    candidateData.map(c => ({ ...c, password, roles: ['CANDIDATE'], verifiedAccount: true }))
  );
  console.log(`✅ ${candidates.length} candidats créés`);

  // Create job offers
  const jobOffers = await JobOffer.insertMany([
    {
      company: companies[0]._id, workingMode: workingModes[2]._id, jobOfferModel: jobModels[0]._id,
      title: 'Développeur Full-Stack JavaScript', profilesNeeded: 2,
      description: 'Rejoignez notre équipe tech pour développer des applications web modernes.',
      softSkills: ['Communication', 'Travail en équipe', 'Adaptabilité'],
      hardSkills: [{ skill: 'JavaScript', level: 4 }, { skill: 'React', level: 3 }, { skill: 'Node.js', level: 3 }],
      softwareSkills: [{ skill: 'VS Code', level: 3 }, { skill: 'GitHub', level: 4 }],
      attributes: [], status: 'open',
    },
    {
      company: companies[2]._id, workingMode: workingModes[1]._id, jobOfferModel: jobModels[0]._id,
      title: 'Data Scientist / Machine Learning', profilesNeeded: 1,
      description: 'Développer des modèles ML pour notre plateforme IA.',
      softSkills: ['Curiosité', 'Rigueur', 'Analyse'],
      hardSkills: [{ skill: 'Python', level: 4 }, { skill: 'Machine Learning', level: 4 }, { skill: 'Deep Learning', level: 3 }],
      softwareSkills: [{ skill: 'VS Code', level: 3 }, { skill: 'GitHub', level: 3 }],
      attributes: [], status: 'open',
    },
    {
      company: companies[3]._id, workingMode: workingModes[2]._id, jobOfferModel: jobModels[1]._id,
      title: 'Analyste Data & Power BI', profilesNeeded: 1,
      description: 'Analyse des données et création de tableaux de bord Power BI.',
      softSkills: ['Analyse', 'Présentation', 'Organisation'],
      hardSkills: [{ skill: 'SQL', level: 4 }, { skill: 'Power BI', level: 4 }, { skill: 'Python', level: 3 }],
      softwareSkills: [{ skill: 'Power BI Desktop', level: 4 }, { skill: 'MySQL Workbench', level: 3 }],
      attributes: [], status: 'open',
    },
    {
      company: companies[4]._id, workingMode: workingModes[1]._id, jobOfferModel: jobModels[0]._id,
      title: 'Ingénieur DevOps / Cloud', profilesNeeded: 2,
      description: 'Mise en place et gestion de l\'infrastructure cloud.',
      softSkills: ['Rigueur', 'Autonomie', 'Leadership'],
      hardSkills: [{ skill: 'Docker', level: 4 }, { skill: 'Kubernetes', level: 3 }, { skill: 'AWS', level: 4 }],
      softwareSkills: [{ skill: 'Jenkins', level: 3 }, { skill: 'GitLab CI', level: 3 }],
      attributes: [], status: 'open',
    },
    {
      company: companies[1]._id, workingMode: workingModes[2]._id, jobOfferModel: jobModels[2]._id,
      title: 'Stage Développeur Angular', profilesNeeded: 1,
      description: 'Stage de 6 mois au sein de notre équipe frontend.',
      softSkills: ['Communication', 'Curiosité'],
      hardSkills: [{ skill: 'Angular', level: 3 }, { skill: 'TypeScript', level: 3 }],
      softwareSkills: [{ skill: 'VS Code', level: 3 }, { skill: 'GitHub', level: 3 }],
      attributes: [], status: 'open',
    },
  ]);
  console.log(`✅ ${jobOffers.length} offres d'emploi créées`);

  // Create applications (linking candidates to offers with match scores)
  const applications = await Application.insertMany([
    { user: candidates[0]._id, jobOffer: jobOffers[0]._id, status: 2, matchScore: 85, coverLetter: 'Je suis très motivée par ce poste.' },
    { user: candidates[5]._id, jobOffer: jobOffers[0]._id, status: 1, matchScore: 72, coverLetter: 'Mon profil correspond bien à vos besoins.' },
    { user: candidates[1]._id, jobOffer: jobOffers[1]._id, status: 4, matchScore: 92, coverLetter: 'Passionné par le ML, je souhaite rejoindre votre équipe.' },
    { user: candidates[6]._id, jobOffer: jobOffers[1]._id, status: 2, matchScore: 95, coverLetter: 'Expérience solide en Deep Learning.' },
    { user: candidates[3]._id, jobOffer: jobOffers[2]._id, status: 4, matchScore: 90, coverLetter: 'Expert Power BI avec 3 ans d\'expérience.' },
    { user: candidates[1]._id, jobOffer: jobOffers[2]._id, status: 2, matchScore: 75, coverLetter: 'Python et SQL sont mes points forts.' },
    { user: candidates[4]._id, jobOffer: jobOffers[3]._id, status: 2, matchScore: 88, coverLetter: 'AWS certifié, expérience Docker/K8s.' },
    { user: candidates[9]._id, jobOffer: jobOffers[3]._id, status: 1, matchScore: 83, coverLetter: 'Spécialiste cloud avec 4 ans d\'exp.' },
    { user: candidates[8]._id, jobOffer: jobOffers[4]._id, status: 1, matchScore: 80, coverLetter: 'Passionnée par Angular depuis 2 ans.' },
    { user: candidates[0]._id, jobOffer: jobOffers[4]._id, status: 3, matchScore: 60, coverLetter: 'Je connais bien le frontend.' },
  ]);
  console.log(`✅ ${applications.length} candidatures créées`);

  // Create interviews for accepted applications
  const interviews = await Interview.insertMany([
    {
      applicationId: applications[2]._id, companyId: companies[2]._id,
      candidateId: candidates[1]._id, jobOfferId: jobOffers[1]._id,
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      channelName: `shape-interview-${applications[2]._id}`, status: 'scheduled',
    },
    {
      applicationId: applications[4]._id, companyId: companies[3]._id,
      candidateId: candidates[3]._id, jobOfferId: jobOffers[2]._id,
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      channelName: `shape-interview-${applications[4]._id}`, status: 'scheduled',
    },
  ]);
  console.log(`✅ ${interviews.length} entretiens planifiés`);

  console.log('\n🎉 Seed terminé avec succès !');
  console.log('📧 Login test : rh@techcorp.fr / Shape2025!');
  console.log('📧 Candidat test : alice@example.com / Shape2025!');

  await mongoose.disconnect();
}

seed().catch(err => { console.error('❌ Seed error:', err); process.exit(1); });
