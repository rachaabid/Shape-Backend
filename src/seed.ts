import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

import User          from './models/User';
import Company       from './models/Company';
import Language      from './models/Language';
import Country       from './models/Country';
import HardSkill     from './models/HardSkill';
import SoftwareSkill from './models/SoftwareSkill';
import FocusedSkill  from './models/FocusedSkill';
import Program       from './models/Program';
import WorkingMode   from './models/WorkingMode';
import JobOfferModel from './models/JobOfferModel';
import Career        from './models/Career';
import Quiz          from './models/Quiz';
import JobOffer      from './models/JobOffer';
import Application   from './models/JobOfferApplication';
import Interview     from './models/Interview';
import Task          from './models/Task';
import TaskResponse  from './models/TaskResponse';

// ── Reference Data ────────────────────────────────────────────

const languages = [
  { name: { fr: 'Français', en: 'French',  ar: 'الفرنسية'   }, code: 'fr', flag: '🇫🇷' },
  { name: { fr: 'Anglais',  en: 'English', ar: 'الإنجليزية' }, code: 'en', flag: '🇬🇧' },
  { name: { fr: 'Arabe',    en: 'Arabic',  ar: 'العربية'    }, code: 'ar', flag: '🇹🇳' },
  { name: { fr: 'Espagnol', en: 'Spanish', ar: 'الإسبانية'  }, code: 'es', flag: '🇪🇸' },
];

const countriesData = [
  { name: { fr: 'France',    en: 'France',        ar: 'فرنسا'        }, code: 'FR', flag: '🇫🇷' },
  { name: { fr: 'Algérie',   en: 'Algeria',       ar: 'الجزائر'      }, code: 'DZ', flag: '🇩🇿' },
  { name: { fr: 'Maroc',     en: 'Morocco',       ar: 'المغرب'       }, code: 'MA', flag: '🇲🇦' },
  { name: { fr: 'Tunisie',   en: 'Tunisia',       ar: 'تونس'         }, code: 'TN', flag: '🇹🇳' },
  { name: { fr: 'Belgique',  en: 'Belgium',       ar: 'بلجيكا'       }, code: 'BE', flag: '🇧🇪' },
  { name: { fr: 'Canada',    en: 'Canada',        ar: 'كندا'         }, code: 'CA', flag: '🇨🇦' },
  { name: { fr: 'USA',       en: 'United States', ar: 'الولايات المتحدة' }, code: 'US', flag: '🇺🇸' },
  { name: { fr: 'Espagne',   en: 'Spain',         ar: 'إسبانيا'      }, code: 'ES', flag: '🇪🇸' },
];

const hardSkillsData = [
  { name: { fr: 'SEO / Référencement naturel',   en: 'SEO',                     ar: 'تحسين محركات البحث'    }, category: 'SEO' },
  { name: { fr: 'SEA / Google Ads',             en: 'Google Ads / SEA',         ar: 'إعلانات جوجل'          }, category: 'Paid' },
  { name: { fr: 'Facebook & Instagram Ads',     en: 'Facebook & Instagram Ads', ar: 'إعلانات فيسبوك'        }, category: 'Paid' },
  { name: { fr: 'TikTok Ads',                   en: 'TikTok Ads',               ar: 'إعلانات تيك توك'       }, category: 'Paid' },
  { name: { fr: 'Email Marketing',              en: 'Email Marketing',           ar: 'التسويق عبر البريد'    }, category: 'Email' },
  { name: { fr: 'Marketing de contenu',         en: 'Content Marketing',         ar: 'تسويق المحتوى'         }, category: 'Content' },
  { name: { fr: 'Copywriting',                  en: 'Copywriting',               ar: 'كتابة الإعلانات'       }, category: 'Content' },
  { name: { fr: 'Community Management',         en: 'Community Management',      ar: 'إدارة المجتمع'         }, category: 'Social' },
  { name: { fr: 'Social Media Marketing',       en: 'Social Media Marketing',    ar: 'تسويق وسائل التواصل'   }, category: 'Social' },
  { name: { fr: 'Marketing d\'affiliation',     en: 'Affiliate Marketing',       ar: 'التسويق بالعمولة'      }, category: 'Performance' },
  { name: { fr: 'Growth Hacking',               en: 'Growth Hacking',            ar: 'اختراق النمو'          }, category: 'Performance' },
  { name: { fr: 'Analyse web / Analytics',      en: 'Web Analytics',             ar: 'تحليل الويب'           }, category: 'Analytics' },
  { name: { fr: 'A/B Testing',                  en: 'A/B Testing',               ar: 'اختبار A/B'            }, category: 'Analytics' },
  { name: { fr: 'Gestion de marque',            en: 'Brand Management',          ar: 'إدارة العلامة التجارية' }, category: 'Brand' },
  { name: { fr: 'Stratégie digitale',           en: 'Digital Strategy',          ar: 'الاستراتيجية الرقمية'  }, category: 'Strategy' },
  { name: { fr: 'Création de contenu vidéo',    en: 'Video Content Creation',    ar: 'إنشاء محتوى مرئي'      }, category: 'Content' },
  { name: { fr: 'Podcast & audio marketing',    en: 'Podcast Marketing',         ar: 'تسويق البودكاست'       }, category: 'Content' },
  { name: { fr: 'Gestion de campagnes',         en: 'Campaign Management',       ar: 'إدارة الحملات'         }, category: 'Strategy' },
  { name: { fr: 'Marketing d\'influence',       en: 'Influencer Marketing',      ar: 'التسويق عبر المؤثرين'  }, category: 'Social' },
  { name: { fr: 'E-commerce & conversion',      en: 'E-commerce & CRO',          ar: 'التجارة الإلكترونية'   }, category: 'Performance' },
];

const softwareSkillsData = [
  { name: { fr: 'Canva',              en: 'Canva',              ar: 'كانفا'             }, category: 'Design' },
  { name: { fr: 'Adobe Photoshop',    en: 'Adobe Photoshop',    ar: 'فوتوشوب'           }, category: 'Design' },
  { name: { fr: 'Adobe Illustrator',  en: 'Adobe Illustrator',  ar: 'إليستريتور'        }, category: 'Design' },
  { name: { fr: 'Adobe Premiere Pro', en: 'Adobe Premiere Pro', ar: 'بريمير برو'        }, category: 'Video' },
  { name: { fr: 'CapCut',             en: 'CapCut',             ar: 'كاب كت'            }, category: 'Video' },
  { name: { fr: 'Hootsuite',          en: 'Hootsuite',          ar: 'هوت سويت'          }, category: 'Social' },
  { name: { fr: 'Buffer',             en: 'Buffer',             ar: 'بافر'              }, category: 'Social' },
  { name: { fr: 'Meta Business Suite', en: 'Meta Business Suite', ar: 'ميتا بيزنس سويت' }, category: 'Social' },
  { name: { fr: 'Google Analytics',   en: 'Google Analytics',   ar: 'جوجل أناليتيكس'   }, category: 'Analytics' },
  { name: { fr: 'Google Search Console', en: 'Google Search Console', ar: 'جوجل سيرش كونسول' }, category: 'SEO' },
  { name: { fr: 'SEMrush',            en: 'SEMrush',            ar: 'سيم راش'           }, category: 'SEO' },
  { name: { fr: 'Ahrefs',             en: 'Ahrefs',             ar: 'أحريفز'            }, category: 'SEO' },
  { name: { fr: 'Mailchimp',          en: 'Mailchimp',          ar: 'ميل شيمب'          }, category: 'Email' },
  { name: { fr: 'HubSpot',            en: 'HubSpot',            ar: 'هب سبوت'           }, category: 'CRM' },
  { name: { fr: 'Salesforce',         en: 'Salesforce',         ar: 'سيلز فورس'         }, category: 'CRM' },
  { name: { fr: 'Klaviyo',            en: 'Klaviyo',            ar: 'كلافيو'            }, category: 'Email' },
  { name: { fr: 'WordPress',          en: 'WordPress',          ar: 'ووردبريس'          }, category: 'CMS' },
  { name: { fr: 'Shopify',            en: 'Shopify',            ar: 'شوبيفاي'           }, category: 'E-commerce' },
  { name: { fr: 'Google Ads Editor',  en: 'Google Ads Editor',  ar: 'محرر إعلانات جوجل' }, category: 'Paid' },
  { name: { fr: 'Notion',             en: 'Notion',             ar: 'نوشن'              }, category: 'Gestion' },
];

const focusedSkillsData = [
  { name: { fr: 'Stratégie Social Media',          en: 'Social Media Strategy',      ar: 'استراتيجية وسائل التواصل' }, category: 'Social' },
  { name: { fr: 'Référencement SEO/SEA',           en: 'SEO / SEA',                  ar: 'تحسين محركات البحث'       }, category: 'SEO' },
  { name: { fr: 'Création de contenu',             en: 'Content Creation',            ar: 'إنشاء المحتوى'            }, category: 'Content' },
  { name: { fr: 'Publicité payante (Paid Ads)',    en: 'Paid Advertising',            ar: 'الإعلانات المدفوعة'       }, category: 'Paid' },
  { name: { fr: 'Email Marketing & Automation',   en: 'Email Marketing Automation',  ar: 'أتمتة البريد الإلكتروني'  }, category: 'Email' },
  { name: { fr: 'Analytics & Reporting',           en: 'Analytics & Reporting',       ar: 'التحليلات والتقارير'      }, category: 'Analytics' },
  { name: { fr: 'Marketing d\'influence',          en: 'Influencer Marketing',        ar: 'تسويق المؤثرين'           }, category: 'Influence' },
  { name: { fr: 'Développement de marque',         en: 'Brand Development',           ar: 'تطوير العلامة التجارية'   }, category: 'Brand' },
  { name: { fr: 'Marketing e-commerce',            en: 'E-commerce Marketing',        ar: 'تسويق التجارة الإلكترونية' }, category: 'E-commerce' },
  { name: { fr: 'Community Management',            en: 'Community Management',        ar: 'إدارة المجتمع'            }, category: 'Social' },
];

const careersData = [
  { name: { fr: 'Responsable Social Media',       en: 'Social Media Manager',        ar: 'مدير وسائل التواصل'       }, domain: 'Social Media' },
  { name: { fr: 'Community Manager',              en: 'Community Manager',           ar: 'مدير المجتمع'              }, domain: 'Social Media' },
  { name: { fr: 'Créateur de contenu',            en: 'Content Creator',             ar: 'منشئ محتوى'               }, domain: 'Content' },
  { name: { fr: 'Spécialiste SEO',                en: 'SEO Specialist',              ar: 'متخصص SEO'                }, domain: 'SEO' },
  { name: { fr: 'Responsable Marketing Digital',  en: 'Digital Marketing Manager',   ar: 'مدير التسويق الرقمي'      }, domain: 'Management' },
  { name: { fr: 'Growth Hacker',                  en: 'Growth Hacker',               ar: 'متخصص النمو'              }, domain: 'Performance' },
  { name: { fr: 'Spécialiste Email Marketing',    en: 'Email Marketing Specialist',  ar: 'متخصص تسويق البريد'       }, domain: 'Email' },
  { name: { fr: 'Chargé de publicité digitale',   en: 'Digital Ads Specialist',      ar: 'متخصص الإعلانات الرقمية'  }, domain: 'Paid Ads' },
  { name: { fr: 'Brand Strategist',               en: 'Brand Strategist',            ar: 'استراتيجي العلامة التجارية' }, domain: 'Brand' },
  { name: { fr: 'Spécialiste Influence Marketing', en: 'Influencer Marketing Specialist', ar: 'متخصص تسويق المؤثرين' }, domain: 'Influence' },
];

const programsData = [
  { title: { fr: 'Formation Social Media Marketing',    en: 'Social Media Marketing Program',  ar: 'برنامج تسويق وسائل التواصل'   }, career: 'Responsable Social Media',      skill: 'Social Media Marketing'    },
  { title: { fr: 'Formation SEO & Référencement',       en: 'SEO & Search Ranking Program',     ar: 'برنامج تحسين محركات البحث'    }, career: 'Spécialiste SEO',               skill: 'SEO / Référencement naturel' },
  { title: { fr: 'Formation Content Marketing',         en: 'Content Marketing Program',        ar: 'برنامج تسويق المحتوى'          }, career: 'Créateur de contenu',           skill: 'Marketing de contenu'       },
  { title: { fr: 'Formation Email Marketing',           en: 'Email Marketing Program',          ar: 'برنامج التسويق بالبريد'         }, career: 'Spécialiste Email Marketing',   skill: 'Email Marketing'            },
  { title: { fr: 'Formation Google Ads & Paid Media',   en: 'Google Ads & Paid Media Program',  ar: 'برنامج إعلانات جوجل'           }, career: 'Chargé de publicité digitale',  skill: 'SEA / Google Ads'           },
  { title: { fr: 'Formation Analytics & Data Driven',   en: 'Analytics & Data-Driven Marketing', ar: 'برنامج التحليلات التسويقية'   }, career: 'Responsable Marketing Digital', skill: 'Analyse web / Analytics'    },
  { title: { fr: 'Formation Community Management',      en: 'Community Management Program',     ar: 'برنامج إدارة المجتمع'          }, career: 'Community Manager',             skill: 'Community Management'       },
  { title: { fr: 'Formation Marketing d\'influence',    en: 'Influencer Marketing Program',     ar: 'برنامج تسويق المؤثرين'         }, career: 'Spécialiste Influence Marketing', skill: 'Marketing d\'influence'   },
];

const workingModesData = [
  { name: { fr: 'Présentiel',  en: 'On-site', ar: 'حضوري'   }, description: { fr: 'Travail en entreprise', en: 'Work on-site',   ar: 'عمل في المقر'    } },
  { name: { fr: 'Télétravail', en: 'Remote',  ar: 'عن بُعد'  }, description: { fr: 'Travail à distance',  en: 'Work remotely',  ar: 'عمل عن بُعد'     } },
  { name: { fr: 'Hybride',     en: 'Hybrid',  ar: 'هجين'    }, description: { fr: 'Mix présentiel/télétravail', en: 'Mix on-site/remote', ar: 'مزيج حضوري/بُعد' } },
];

const jobOfferModelsData = [
  { name: { fr: 'CDI',          en: 'Permanent Contract',    ar: 'عقد دائم'         } },
  { name: { fr: 'CDD',          en: 'Fixed-term Contract',   ar: 'عقد محدد المدة'  } },
  { name: { fr: 'Stage',        en: 'Internship',            ar: 'تدريب'            } },
  { name: { fr: 'Alternance',   en: 'Apprenticeship',        ar: 'تكوين متناوب'    } },
  { name: { fr: 'Freelance',    en: 'Freelance',             ar: 'مستقل'            } },
];

// ── Seed Function ─────────────────────────────────────────────

async function seed() {
  await mongoose.connect(process.env.MONGO_URI!);
  console.log('✅ MongoDB connecté');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}), Company.deleteMany({}),
    Language.deleteMany({}), Country.deleteMany({}),
    HardSkill.deleteMany({}), SoftwareSkill.deleteMany({}),
    FocusedSkill.deleteMany({}), Program.deleteMany({}),
    WorkingMode.deleteMany({}), JobOfferModel.deleteMany({}),
    Career.deleteMany({}), Quiz.deleteMany({}),
    JobOffer.deleteMany({}), Application.deleteMany({}),
    Interview.deleteMany({}), Task.deleteMany({}), TaskResponse.deleteMany({}),
  ]);
  console.log('🗑️  Collections nettoyées');

  // Insert reference data
  const [langs, insertedCountries, hardSkills, softSkills, focusedSkills, programs, workingModes, jobModels, careers] =
    await Promise.all([
      Language.insertMany(languages),
      Country.insertMany(countriesData),
      HardSkill.insertMany(hardSkillsData),
      SoftwareSkill.insertMany(softwareSkillsData),
      FocusedSkill.insertMany(focusedSkillsData),
      Program.insertMany(programsData),
      WorkingMode.insertMany(workingModesData),
      JobOfferModel.insertMany(jobOfferModelsData),
      Career.insertMany(careersData),
    ]);
  console.log(`✅ Référentiel : ${langs.length} langues, ${insertedCountries.length} pays, ${hardSkills.length} hard skills, ${softSkills.length} softwares, ${focusedSkills.length} focused, ${programs.length} programmes, ${careers.length} carrières`);

  // Insert quizzes (one per program)
  const quizzes = await Quiz.insertMany([
    {
      title: { fr: 'Quiz Social Media Marketing', en: 'Social Media Marketing Quiz' },
      program: programs[0]._id,
      passingScore: 70,
      questions: [
        {
          question: { fr: 'Quelle métrique mesure l\'engagement sur Instagram ?', en: 'Which metric measures engagement on Instagram?' },
          options:  { fr: ['Impressions', 'Taux d\'engagement', 'Portée', 'CPM'], en: ['Impressions', 'Engagement Rate', 'Reach', 'CPM'] },
          correctIndex: 1,
        },
        {
          question: { fr: 'Quel est le meilleur format pour augmenter la portée sur Facebook ?', en: 'What is the best format to increase reach on Facebook?' },
          options:  { fr: ['Texte seul', 'Image', 'Vidéo native', 'Lien externe'], en: ['Text only', 'Image', 'Native video', 'External link'] },
          correctIndex: 2,
        },
        {
          question: { fr: 'Qu\'est-ce qu\'un KPI en marketing ?', en: 'What is a KPI in marketing?' },
          options:  { fr: ['Un type de publicité', 'Un indicateur clé de performance', 'Un réseau social', 'Une plateforme CRM'], en: ['A type of ad', 'A key performance indicator', 'A social network', 'A CRM platform'] },
          correctIndex: 1,
        },
      ],
    },
    {
      title: { fr: 'Quiz SEO & Référencement', en: 'SEO & Search Ranking Quiz' },
      program: programs[1]._id,
      passingScore: 70,
      questions: [
        {
          question: { fr: 'Que signifie SEO ?', en: 'What does SEO stand for?' },
          options:  { fr: ['Social Engine Optimization', 'Search Engine Optimization', 'Search Engine Operation', 'Social Exchange Online'], en: ['Social Engine Optimization', 'Search Engine Optimization', 'Search Engine Operation', 'Social Exchange Online'] },
          correctIndex: 1,
        },
        {
          question: { fr: 'Quel outil Google permet de surveiller les performances SEO ?', en: 'Which Google tool monitors SEO performance?' },
          options:  { fr: ['Google Ads', 'Google Analytics', 'Google Search Console', 'Google Tag Manager'], en: ['Google Ads', 'Google Analytics', 'Google Search Console', 'Google Tag Manager'] },
          correctIndex: 2,
        },
        {
          question: { fr: 'Qu\'est-ce qu\'un backlink ?', en: 'What is a backlink?' },
          options:  { fr: ['Un lien interne', 'Un lien d\'un site externe vers votre site', 'Un bouton retour', 'Un lien brisé'], en: ['An internal link', 'A link from an external site to yours', 'A back button', 'A broken link'] },
          correctIndex: 1,
        },
      ],
    },
    {
      title: { fr: 'Quiz Content Marketing', en: 'Content Marketing Quiz' },
      program: programs[2]._id,
      passingScore: 70,
      questions: [
        {
          question: { fr: 'Quel est l\'objectif principal du content marketing ?', en: 'What is the main goal of content marketing?' },
          options:  { fr: ['Vendre directement', 'Attirer et fidéliser une audience', 'Faire de la publicité payante', 'Optimiser le SEO uniquement'], en: ['Sell directly', 'Attract and retain an audience', 'Run paid ads', 'Optimize SEO only'] },
          correctIndex: 1,
        },
        {
          question: { fr: 'Qu\'est-ce que le storytelling en marketing ?', en: 'What is storytelling in marketing?' },
          options:  { fr: ['Écrire des blogs', 'Raconter une histoire de marque pour engager l\'audience', 'Créer des publicités vidéo', 'Rédiger des emails'], en: ['Writing blogs', 'Telling a brand story to engage audience', 'Creating video ads', 'Writing emails'] },
          correctIndex: 1,
        },
      ],
    },
    {
      title: { fr: 'Quiz Email Marketing', en: 'Email Marketing Quiz' },
      program: programs[3]._id,
      passingScore: 70,
      questions: [
        {
          question: { fr: 'Qu\'est-ce que le taux d\'ouverture d\'un email ?', en: 'What is an email open rate?' },
          options:  { fr: ['Le % d\'emails reçus', 'Le % d\'emails ouverts / envoyés', 'Le % de clics', 'Le % de désinscriptions'], en: ['% of emails received', '% of opened / sent emails', '% of clicks', '% of unsubscribes'] },
          correctIndex: 1,
        },
        {
          question: { fr: 'Quelle plateforme est populaire pour l\'email marketing automatisé ?', en: 'Which platform is popular for automated email marketing?' },
          options:  { fr: ['Notion', 'Slack', 'Mailchimp', 'Figma'], en: ['Notion', 'Slack', 'Mailchimp', 'Figma'] },
          correctIndex: 2,
        },
      ],
    },
    {
      title: { fr: 'Quiz Google Ads & Paid Media', en: 'Google Ads & Paid Media Quiz' },
      program: programs[4]._id,
      passingScore: 70,
      questions: [
        {
          question: { fr: 'Que signifie CPC ?', en: 'What does CPC stand for?' },
          options:  { fr: ['Cost Per Click', 'Content Per Campaign', 'Click Per Customer', 'Cost Per Content'], en: ['Cost Per Click', 'Content Per Campaign', 'Click Per Customer', 'Cost Per Content'] },
          correctIndex: 0,
        },
        {
          question: { fr: 'Quel est le réseau publicitaire le plus utilisé ?', en: 'What is the most used ad network?' },
          options:  { fr: ['Bing Ads', 'Twitter Ads', 'Google Ads', 'TikTok Ads'], en: ['Bing Ads', 'Twitter Ads', 'Google Ads', 'TikTok Ads'] },
          correctIndex: 2,
        },
      ],
    },
  ]);
  console.log(`✅ ${quizzes.length} quiz créés`);

  // Company users (digital marketing agencies)
  const password = await bcrypt.hash('Shape2025!', 10);
  const companyUsers = await User.insertMany([
    { login: 'mediaspark',  email: 'rh@mediaspark.fr',  password, roles: ['COMPANY'], firstName: { fr: 'Sophie'  }, lastName: { fr: 'Martin'  }, verifiedAccount: true },
    { login: 'buzzagency',  email: 'rh@buzzagency.fr',  password, roles: ['COMPANY'], firstName: { fr: 'Julien'  }, lastName: { fr: 'Dupont'  }, verifiedAccount: true },
    { login: 'contentlab',  email: 'hr@contentlab.fr',  password, roles: ['COMPANY'], firstName: { fr: 'Emma'    }, lastName: { fr: 'Bernard' }, verifiedAccount: true },
    { login: 'growthio',    email: 'rh@growthio.fr',    password, roles: ['COMPANY'], firstName: { fr: 'Lucas'   }, lastName: { fr: 'Moreau'  }, verifiedAccount: true },
    { login: 'adboost',     email: 'rh@adboost.fr',     password, roles: ['COMPANY'], firstName: { fr: 'Léa'     }, lastName: { fr: 'Petit'   }, verifiedAccount: true },
  ]);

  const companies = await Company.insertMany([
    { name: { fr: 'Media Spark',      en: 'Media Spark'      }, address: { fr: 'Paris, France'     }, owner: companyUsers[0]._id },
    { name: { fr: 'Buzz Agency',      en: 'Buzz Agency'      }, address: { fr: 'Lyon, France'      }, owner: companyUsers[1]._id },
    { name: { fr: 'Content Lab',      en: 'Content Lab'      }, address: { fr: 'Bordeaux, France'  }, owner: companyUsers[2]._id },
    { name: { fr: 'Growth IO',        en: 'Growth IO'        }, address: { fr: 'Marseille, France' }, owner: companyUsers[3]._id },
    { name: { fr: 'AdBoost Digital',  en: 'AdBoost Digital'  }, address: { fr: 'Toulouse, France'  }, owner: companyUsers[4]._id },
  ]);
  console.log(`✅ ${companies.length} entreprises créées`);

  // Candidate users — digital marketing profiles
  const candidateData = [
    {
      login: 'sarah.social',   email: 'sarah@example.com',
      firstName: { fr: 'Sarah'   }, lastName: { fr: 'Benali'   },
      hardSkills:  [{ skill: 'Social Media Marketing', level: 5 }, { skill: 'Community Management', level: 4 }, { skill: 'Copywriting', level: 3 }],
      softwares:   [{ skill: 'Hootsuite', level: 4 }, { skill: 'Canva', level: 5 }, { skill: 'Meta Business Suite', level: 4 }],
      softSkills:  ['Créativité', 'Communication', 'Adaptabilité'],
      languages:   ['fr', 'en'], workingMode: 'Hybride', country: 'FR',
    },
    {
      login: 'adam.seo',       email: 'adam@example.com',
      firstName: { fr: 'Adam'    }, lastName: { fr: 'Chérif'   },
      hardSkills:  [{ skill: 'SEO / Référencement naturel', level: 5 }, { skill: 'Analyse web / Analytics', level: 4 }, { skill: 'Marketing de contenu', level: 3 }],
      softwares:   [{ skill: 'SEMrush', level: 5 }, { skill: 'Ahrefs', level: 4 }, { skill: 'Google Search Console', level: 5 }],
      softSkills:  ['Rigueur', 'Curiosité', 'Analyse'],
      languages:   ['fr', 'en', 'ar'], workingMode: 'Télétravail', country: 'MA',
    },
    {
      login: 'mia.content',    email: 'mia@example.com',
      firstName: { fr: 'Mia'     }, lastName: { fr: 'Laurent'  },
      hardSkills:  [{ skill: 'Marketing de contenu', level: 5 }, { skill: 'Copywriting', level: 5 }, { skill: 'Création de contenu vidéo', level: 4 }],
      softwares:   [{ skill: 'Canva', level: 5 }, { skill: 'Adobe Premiere Pro', level: 3 }, { skill: 'WordPress', level: 4 }],
      softSkills:  ['Créativité', 'Rédaction', 'Organisation'],
      languages:   ['fr', 'en'], workingMode: 'Hybride', country: 'BE',
    },
    {
      login: 'karim.ads',      email: 'karim@example.com',
      firstName: { fr: 'Karim'   }, lastName: { fr: 'Mansouri' },
      hardSkills:  [{ skill: 'SEA / Google Ads', level: 5 }, { skill: 'Facebook & Instagram Ads', level: 5 }, { skill: 'A/B Testing', level: 4 }],
      softwares:   [{ skill: 'Google Ads Editor', level: 5 }, { skill: 'Meta Business Suite', level: 5 }, { skill: 'Google Analytics', level: 4 }],
      softSkills:  ['Analyse', 'Rigueur', 'Résultats'],
      languages:   ['fr', 'en', 'ar'], workingMode: 'Télétravail', country: 'DZ',
    },
    {
      login: 'lisa.email',     email: 'lisa@example.com',
      firstName: { fr: 'Lisa'    }, lastName: { fr: 'Morin'    },
      hardSkills:  [{ skill: 'Email Marketing', level: 5 }, { skill: 'Gestion de campagnes', level: 4 }, { skill: 'A/B Testing', level: 3 }],
      softwares:   [{ skill: 'Mailchimp', level: 5 }, { skill: 'Klaviyo', level: 4 }, { skill: 'HubSpot', level: 3 }],
      softSkills:  ['Organisation', 'Précision', 'Communication'],
      languages:   ['fr', 'en'], workingMode: 'Présentiel', country: 'FR',
    },
    {
      login: 'hugo.growth',    email: 'hugo@example.com',
      firstName: { fr: 'Hugo'    }, lastName: { fr: 'Faure'    },
      hardSkills:  [{ skill: 'Growth Hacking', level: 5 }, { skill: 'Marketing d\'affiliation', level: 4 }, { skill: 'E-commerce & conversion', level: 4 }],
      softwares:   [{ skill: 'Google Analytics', level: 5 }, { skill: 'HubSpot', level: 4 }, { skill: 'Shopify', level: 4 }],
      softSkills:  ['Innovation', 'Analyse', 'Autonomie'],
      languages:   ['fr', 'en'], workingMode: 'Télétravail', country: 'CA',
    },
    {
      login: 'nora.brand',     email: 'nora@example.com',
      firstName: { fr: 'Nora'    }, lastName: { fr: 'Hamidi'   },
      hardSkills:  [{ skill: 'Gestion de marque', level: 5 }, { skill: 'Stratégie digitale', level: 4 }, { skill: 'Community Management', level: 3 }],
      softwares:   [{ skill: 'Canva', level: 4 }, { skill: 'Adobe Illustrator', level: 3 }, { skill: 'Hootsuite', level: 3 }],
      softSkills:  ['Leadership', 'Créativité', 'Stratégie'],
      languages:   ['fr', 'en', 'ar'], workingMode: 'Hybride', country: 'TN',
    },
    {
      login: 'omar.influence', email: 'omar@example.com',
      firstName: { fr: 'Omar'    }, lastName: { fr: 'Diallo'   },
      hardSkills:  [{ skill: 'Marketing d\'influence', level: 5 }, { skill: 'Social Media Marketing', level: 4 }, { skill: 'Création de contenu vidéo', level: 4 }],
      softwares:   [{ skill: 'Buffer', level: 4 }, { skill: 'CapCut', level: 5 }, { skill: 'Meta Business Suite', level: 4 }],
      softSkills:  ['Réseau', 'Créativité', 'Négociation'],
      languages:   ['fr', 'en'], workingMode: 'Hybride', country: 'FR',
    },
    {
      login: 'chloe.analytics', email: 'chloe@example.com',
      firstName: { fr: 'Chloé'  }, lastName: { fr: 'Renaud'   },
      hardSkills:  [{ skill: 'Analyse web / Analytics', level: 5 }, { skill: 'A/B Testing', level: 5 }, { skill: 'Stratégie digitale', level: 3 }],
      softwares:   [{ skill: 'Google Analytics', level: 5 }, { skill: 'Google Search Console', level: 4 }, { skill: 'Notion', level: 4 }],
      softSkills:  ['Précision', 'Rigueur', 'Présentation'],
      languages:   ['fr', 'en'], workingMode: 'Télétravail', country: 'FR',
    },
    {
      login: 'tarek.paid',     email: 'tarek@example.com',
      firstName: { fr: 'Tarek'   }, lastName: { fr: 'Salah'    },
      hardSkills:  [{ skill: 'TikTok Ads', level: 5 }, { skill: 'Facebook & Instagram Ads', level: 4 }, { skill: 'SEA / Google Ads', level: 3 }],
      softwares:   [{ skill: 'Meta Business Suite', level: 5 }, { skill: 'Google Ads Editor', level: 3 }, { skill: 'Canva', level: 3 }],
      softSkills:  ['Innovation', 'Rapidité', 'Adaptabilité'],
      languages:   ['fr', 'ar'], workingMode: 'Présentiel', country: 'DZ',
    },
  ];

  const candidates = await User.insertMany(
    candidateData.map(c => ({ ...c, password, roles: ['CANDIDATE'], verifiedAccount: true }))
  );
  console.log(`✅ ${candidates.length} candidats créés`);

  // Job offers (digital marketing focused)
  const jobOffers = await JobOffer.insertMany([
    {
      company: companies[0]._id, workingMode: workingModes[2]._id, jobOfferModel: jobModels[0]._id,
      title: 'Social Media Manager',
      description: 'Gérez nos réseaux sociaux et développez notre communauté en ligne.',
      softSkills: ['Créativité', 'Communication', 'Organisation'],
      hardSkills: [{ skill: 'Social Media Marketing', level: 4 }, { skill: 'Community Management', level: 4 }, { skill: 'Copywriting', level: 3 }],
      softwareSkills: [{ skill: 'Hootsuite', level: 3 }, { skill: 'Canva', level: 4 }, { skill: 'Meta Business Suite', level: 3 }],
      profilesNeeded: 2, attributes: [], status: 'open',
    },
    {
      company: companies[1]._id, workingMode: workingModes[1]._id, jobOfferModel: jobModels[0]._id,
      title: 'Spécialiste SEO',
      description: 'Optimisez notre visibilité sur les moteurs de recherche.',
      softSkills: ['Rigueur', 'Analyse', 'Curiosité'],
      hardSkills: [{ skill: 'SEO / Référencement naturel', level: 4 }, { skill: 'Analyse web / Analytics', level: 4 }, { skill: 'Marketing de contenu', level: 3 }],
      softwareSkills: [{ skill: 'SEMrush', level: 4 }, { skill: 'Ahrefs', level: 3 }, { skill: 'Google Search Console', level: 4 }],
      profilesNeeded: 1, attributes: [], status: 'open',
    },
    {
      company: companies[2]._id, workingMode: workingModes[2]._id, jobOfferModel: jobModels[1]._id,
      title: 'Créateur de contenu & Copywriter',
      description: 'Produisez du contenu engageant pour nos clients marques.',
      softSkills: ['Créativité', 'Rédaction', 'Polyvalence'],
      hardSkills: [{ skill: 'Copywriting', level: 5 }, { skill: 'Marketing de contenu', level: 4 }, { skill: 'Création de contenu vidéo', level: 3 }],
      softwareSkills: [{ skill: 'Canva', level: 4 }, { skill: 'WordPress', level: 3 }, { skill: 'Adobe Premiere Pro', level: 3 }],
      profilesNeeded: 1, attributes: [], status: 'open',
    },
    {
      company: companies[3]._id, workingMode: workingModes[1]._id, jobOfferModel: jobModels[0]._id,
      title: 'Chargé de publicité Google Ads & Meta',
      description: 'Pilotez nos campagnes paid media pour maximiser le ROAS.',
      softSkills: ['Analyse', 'Rigueur', 'Résultats'],
      hardSkills: [{ skill: 'SEA / Google Ads', level: 4 }, { skill: 'Facebook & Instagram Ads', level: 4 }, { skill: 'A/B Testing', level: 3 }],
      softwareSkills: [{ skill: 'Google Ads Editor', level: 4 }, { skill: 'Meta Business Suite', level: 4 }, { skill: 'Google Analytics', level: 3 }],
      profilesNeeded: 2, attributes: [], status: 'open',
    },
    {
      company: companies[4]._id, workingMode: workingModes[2]._id, jobOfferModel: jobModels[2]._id,
      title: 'Stage Email Marketing & Automation',
      description: 'Stage 6 mois — créez et automatisez nos campagnes emailing.',
      softSkills: ['Organisation', 'Précision', 'Autonomie'],
      hardSkills: [{ skill: 'Email Marketing', level: 3 }, { skill: 'Gestion de campagnes', level: 3 }],
      softwareSkills: [{ skill: 'Mailchimp', level: 3 }, { skill: 'HubSpot', level: 2 }],
      profilesNeeded: 1, attributes: [], status: 'open',
    },
  ]);
  console.log(`✅ ${jobOffers.length} offres d'emploi créées`);

  // Applications
  const applications = await Application.insertMany([
    { user: candidates[0]._id, jobOffer: jobOffers[0]._id, status: 2, matchScore: 88, coverLetter: 'Je gère des communautés depuis 3 ans et suis passionnée par le social media.' },
    { user: candidates[7]._id, jobOffer: jobOffers[0]._id, status: 1, matchScore: 75, coverLetter: 'Mon expérience en marketing d\'influence me permet de gérer des audiences variées.' },
    { user: candidates[1]._id, jobOffer: jobOffers[1]._id, status: 4, matchScore: 95, coverLetter: 'SEO est ma spécialité depuis 4 ans avec des résultats mesurables.' },
    { user: candidates[8]._id, jobOffer: jobOffers[1]._id, status: 2, matchScore: 80, coverLetter: 'Analytics et SEO sont mes points forts.' },
    { user: candidates[2]._id, jobOffer: jobOffers[2]._id, status: 4, matchScore: 92, coverLetter: 'Copywriter créative avec portfolio fourni.' },
    { user: candidates[6]._id, jobOffer: jobOffers[2]._id, status: 2, matchScore: 76, coverLetter: 'Brand storytelling et content — mon expertise.' },
    { user: candidates[3]._id, jobOffer: jobOffers[3]._id, status: 2, matchScore: 90, coverLetter: 'ROAS x3 sur mes dernières campagnes Meta.' },
    { user: candidates[9]._id, jobOffer: jobOffers[3]._id, status: 1, matchScore: 70, coverLetter: 'TikTok Ads et Meta sont mes canaux de prédilection.' },
    { user: candidates[4]._id, jobOffer: jobOffers[4]._id, status: 1, matchScore: 82, coverLetter: 'Email marketing automatisé avec Mailchimp et Klaviyo.' },
    { user: candidates[5]._id, jobOffer: jobOffers[4]._id, status: 3, matchScore: 55, coverLetter: 'Je suis motivé et souhaite apprendre l\'email marketing.' },
  ]);
  console.log(`✅ ${applications.length} candidatures créées`);

  // Interviews for accepted applications
  const interviews = await Interview.insertMany([
    {
      applicationId: applications[2]._id, companyId: companies[1]._id,
      candidateId: candidates[1]._id, jobOfferId: jobOffers[1]._id,
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      channelName: `shape-${applications[2]._id}`,
      status: 'scheduled', confirmedByCandidate: true, confirmedByCompany: true,
    },
    {
      applicationId: applications[4]._id, companyId: companies[2]._id,
      candidateId: candidates[2]._id, jobOfferId: jobOffers[2]._id,
      scheduledAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      channelName: `shape-${applications[4]._id}`,
      status: 'scheduled', confirmedByCandidate: false, confirmedByCompany: true,
    },
  ]);
  console.log(`✅ ${interviews.length} entretiens planifiés`);

  // Tasks (digital marketing related)
  const tasks = await Task.insertMany([
    { title: { fr: 'Créer un calendrier éditorial', en: 'Create editorial calendar' }, description: { fr: 'Planifier les publications pour le mois prochain sur tous les réseaux.', en: 'Plan next month\'s posts across all networks.' }, deadLineInHours: 48 },
    { title: { fr: 'Audit SEO du site web', en: 'Website SEO audit' }, description: { fr: 'Analyser les performances SEO et identifier les axes d\'amélioration.', en: 'Analyze SEO performance and identify areas for improvement.' }, deadLineInHours: 72 },
    { title: { fr: 'Rédiger 5 articles de blog', en: 'Write 5 blog articles' }, description: { fr: 'Rédiger des articles optimisés SEO sur les tendances du marketing digital.', en: 'Write SEO-optimized articles on digital marketing trends.' }, deadLineInHours: 120 },
    { title: { fr: 'Configurer une campagne Google Ads', en: 'Set up Google Ads campaign' }, description: { fr: 'Créer et lancer une campagne de notoriété sur Google Ads.', en: 'Create and launch a brand awareness campaign on Google Ads.' }, deadLineInHours: 24 },
    { title: { fr: 'Créer une séquence email de bienvenue', en: 'Create welcome email sequence' }, description: { fr: 'Configurer une séquence automatisée de 5 emails de bienvenue.', en: 'Set up an automated welcome email sequence of 5 emails.' }, deadLineInHours: 96 },
    { title: { fr: 'Analyser les métriques des réseaux sociaux', en: 'Analyze social media metrics' }, description: { fr: 'Préparer le rapport mensuel des performances sur Instagram, LinkedIn et Facebook.', en: 'Prepare monthly performance report for Instagram, LinkedIn and Facebook.' }, deadLineInHours: 36 },
  ]);
  console.log(`✅ ${tasks.length} tâches créées`);

  // Task responses
  await TaskResponse.insertMany([
    { task: tasks[0]._id, owner: candidates[0]._id, status: 1 },
    { task: tasks[1]._id, owner: candidates[1]._id, status: 2 },
    { task: tasks[2]._id, owner: candidates[2]._id, status: 0 },
    { task: tasks[3]._id, owner: candidates[3]._id, status: 3 },
    { task: tasks[4]._id, owner: candidates[4]._id, status: 0 },
    { task: tasks[5]._id, owner: candidates[8]._id, status: 1 },
  ]);
  console.log('✅ TaskResponses créées');

  console.log('\n🎉 Seed terminé avec succès !');
  console.log('📧 Login company : rh@mediaspark.fr / Shape2025!');
  console.log('📧 Login candidat : sarah@example.com / Shape2025!');

  await mongoose.disconnect();
}

seed().catch(err => { console.error('❌ Seed error:', err); process.exit(1); });
