import mongoose from 'mongoose';
import bcrypt    from 'bcryptjs';
import dotenv    from 'dotenv';
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
import TextBloc      from './models/TextBloc';
import VideoYoutube  from './models/VideoYoutube';
import JobOffer      from './models/JobOffer';
import Application   from './models/JobOfferApplication';
import Interview     from './models/Interview';
import Task          from './models/Task';
import TaskResponse  from './models/TaskResponse';
import Inscription   from './models/Inscription';

// Helper: date N days ago
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

// ── Reference data (unchanged from original seed) ─────────────

const languages = [
  { name: { fr: 'Français', en: 'French',  ar: 'الفرنسية'   }, code: 'fr', flag: '🇫🇷' },
  { name: { fr: 'Anglais',  en: 'English', ar: 'الإنجليزية' }, code: 'en', flag: '🇬🇧' },
  { name: { fr: 'Arabe',    en: 'Arabic',  ar: 'العربية'    }, code: 'ar', flag: '🇹🇳' },
  { name: { fr: 'Espagnol', en: 'Spanish', ar: 'الإسبانية'  }, code: 'es', flag: '🇪🇸' },
];

const countriesData = [
  { name: { fr: 'France',    en: 'France',        ar: 'فرنسا'            }, code: 'FR', flag: '🇫🇷' },
  { name: { fr: 'Algérie',   en: 'Algeria',       ar: 'الجزائر'          }, code: 'DZ', flag: '🇩🇿' },
  { name: { fr: 'Maroc',     en: 'Morocco',       ar: 'المغرب'           }, code: 'MA', flag: '🇲🇦' },
  { name: { fr: 'Tunisie',   en: 'Tunisia',       ar: 'تونس'             }, code: 'TN', flag: '🇹🇳' },
  { name: { fr: 'Belgique',  en: 'Belgium',       ar: 'بلجيكا'           }, code: 'BE', flag: '🇧🇪' },
  { name: { fr: 'Canada',    en: 'Canada',        ar: 'كندا'             }, code: 'CA', flag: '🇨🇦' },
  { name: { fr: 'USA',       en: 'United States', ar: 'الولايات المتحدة' }, code: 'US', flag: '🇺🇸' },
  { name: { fr: 'Espagne',   en: 'Spain',         ar: 'إسبانيا'          }, code: 'ES', flag: '🇪🇸' },
];

const hardSkillsData = [
  { name: { fr: 'SEO / Référencement naturel',  en: 'SEO',                     ar: 'تحسين محركات البحث'    }, category: 'SEO'         },
  { name: { fr: 'SEA / Google Ads',             en: 'Google Ads / SEA',         ar: 'إعلانات جوجل'          }, category: 'Paid'        },
  { name: { fr: 'Facebook & Instagram Ads',     en: 'Facebook & Instagram Ads', ar: 'إعلانات فيسبوك'        }, category: 'Paid'        },
  { name: { fr: 'TikTok Ads',                   en: 'TikTok Ads',               ar: 'إعلانات تيك توك'       }, category: 'Paid'        },
  { name: { fr: 'Email Marketing',              en: 'Email Marketing',           ar: 'التسويق عبر البريد'    }, category: 'Email'       },
  { name: { fr: 'Marketing de contenu',         en: 'Content Marketing',         ar: 'تسويق المحتوى'         }, category: 'Content'     },
  { name: { fr: 'Copywriting',                  en: 'Copywriting',               ar: 'كتابة الإعلانات'       }, category: 'Content'     },
  { name: { fr: 'Community Management',         en: 'Community Management',      ar: 'إدارة المجتمع'         }, category: 'Social'      },
  { name: { fr: 'Social Media Marketing',       en: 'Social Media Marketing',    ar: 'تسويق وسائل التواصل'   }, category: 'Social'      },
  { name: { fr: 'Marketing d\'affiliation',     en: 'Affiliate Marketing',       ar: 'التسويق بالعمولة'      }, category: 'Performance' },
  { name: { fr: 'Growth Hacking',               en: 'Growth Hacking',            ar: 'اختراق النمو'          }, category: 'Performance' },
  { name: { fr: 'Analyse web / Analytics',      en: 'Web Analytics',             ar: 'تحليل الويب'           }, category: 'Analytics'   },
  { name: { fr: 'A/B Testing',                  en: 'A/B Testing',               ar: 'اختبار A/B'            }, category: 'Analytics'   },
  { name: { fr: 'Gestion de marque',            en: 'Brand Management',          ar: 'إدارة العلامة التجارية' }, category: 'Brand'      },
  { name: { fr: 'Stratégie digitale',           en: 'Digital Strategy',          ar: 'الاستراتيجية الرقمية'  }, category: 'Strategy'    },
  { name: { fr: 'Création de contenu vidéo',    en: 'Video Content Creation',    ar: 'إنشاء محتوى مرئي'      }, category: 'Content'     },
  { name: { fr: 'Gestion de campagnes',         en: 'Campaign Management',       ar: 'إدارة الحملات'         }, category: 'Strategy'    },
  { name: { fr: 'Marketing d\'influence',       en: 'Influencer Marketing',      ar: 'التسويق عبر المؤثرين'  }, category: 'Social'      },
  { name: { fr: 'E-commerce & conversion',      en: 'E-commerce & CRO',          ar: 'التجارة الإلكترونية'   }, category: 'Performance' },
  { name: { fr: 'Podcast & audio marketing',    en: 'Podcast Marketing',         ar: 'تسويق البودكاست'       }, category: 'Content'     },
];

const softwareSkillsData = [
  { name: { fr: 'Canva',               en: 'Canva',               ar: 'كانفا'             }, category: 'Design'      },
  { name: { fr: 'Adobe Photoshop',     en: 'Adobe Photoshop',     ar: 'فوتوشوب'           }, category: 'Design'      },
  { name: { fr: 'Adobe Illustrator',   en: 'Adobe Illustrator',   ar: 'إليستريتور'        }, category: 'Design'      },
  { name: { fr: 'Adobe Premiere Pro',  en: 'Adobe Premiere Pro',  ar: 'بريمير برو'        }, category: 'Video'       },
  { name: { fr: 'CapCut',              en: 'CapCut',              ar: 'كاب كت'            }, category: 'Video'       },
  { name: { fr: 'Hootsuite',           en: 'Hootsuite',           ar: 'هوت سويت'          }, category: 'Social'      },
  { name: { fr: 'Buffer',              en: 'Buffer',              ar: 'بافر'              }, category: 'Social'      },
  { name: { fr: 'Meta Business Suite', en: 'Meta Business Suite', ar: 'ميتا بيزنس سويت'   }, category: 'Social'      },
  { name: { fr: 'Google Analytics',    en: 'Google Analytics',    ar: 'جوجل أناليتيكس'   }, category: 'Analytics'   },
  { name: { fr: 'Google Search Console', en: 'Google Search Console', ar: 'سيرش كونسول' }, category: 'SEO'         },
  { name: { fr: 'SEMrush',             en: 'SEMrush',             ar: 'سيم راش'           }, category: 'SEO'         },
  { name: { fr: 'Ahrefs',              en: 'Ahrefs',              ar: 'أحريفز'            }, category: 'SEO'         },
  { name: { fr: 'Mailchimp',           en: 'Mailchimp',           ar: 'ميل شيمب'          }, category: 'Email'       },
  { name: { fr: 'HubSpot',             en: 'HubSpot',             ar: 'هب سبوت'           }, category: 'CRM'         },
  { name: { fr: 'Salesforce',          en: 'Salesforce',          ar: 'سيلز فورس'         }, category: 'CRM'         },
  { name: { fr: 'Klaviyo',             en: 'Klaviyo',             ar: 'كلافيو'            }, category: 'Email'       },
  { name: { fr: 'WordPress',           en: 'WordPress',           ar: 'ووردبريس'          }, category: 'CMS'         },
  { name: { fr: 'Shopify',             en: 'Shopify',             ar: 'شوبيفاي'           }, category: 'E-commerce'  },
  { name: { fr: 'Google Ads Editor',   en: 'Google Ads Editor',   ar: 'محرر إعلانات جوجل' }, category: 'Paid'       },
  { name: { fr: 'Notion',              en: 'Notion',              ar: 'نوشن'              }, category: 'Gestion'     },
];

const focusedSkillsData = [
  { name: { fr: 'Stratégie Social Media',        en: 'Social Media Strategy',     ar: 'استراتيجية التواصل'  }, category: 'Social'      },
  { name: { fr: 'Référencement SEO/SEA',         en: 'SEO / SEA',                 ar: 'تحسين محركات البحث' }, category: 'SEO'         },
  { name: { fr: 'Création de contenu',           en: 'Content Creation',          ar: 'إنشاء المحتوى'       }, category: 'Content'     },
  { name: { fr: 'Publicité payante',             en: 'Paid Advertising',          ar: 'الإعلانات المدفوعة'  }, category: 'Paid'        },
  { name: { fr: 'Email Marketing & Automation',  en: 'Email Marketing Automation',ar: 'أتمتة البريد'        }, category: 'Email'       },
  { name: { fr: 'Analytics & Reporting',         en: 'Analytics & Reporting',     ar: 'التحليلات'           }, category: 'Analytics'   },
  { name: { fr: 'Marketing d\'influence',        en: 'Influencer Marketing',      ar: 'تسويق المؤثرين'      }, category: 'Influence'   },
  { name: { fr: 'Développement de marque',       en: 'Brand Development',         ar: 'تطوير العلامة'       }, category: 'Brand'       },
  { name: { fr: 'Marketing e-commerce',          en: 'E-commerce Marketing',      ar: 'تجارة إلكترونية'     }, category: 'E-commerce'  },
  { name: { fr: 'Community Management',          en: 'Community Management',      ar: 'إدارة المجتمع'       }, category: 'Social'      },
];

const careersData = [
  { name: { fr: 'Responsable Social Media',        en: 'Social Media Manager',           ar: 'مدير التواصل'         }, domain: 'Social Media' },
  { name: { fr: 'Community Manager',               en: 'Community Manager',              ar: 'مدير المجتمع'          }, domain: 'Social Media' },
  { name: { fr: 'Créateur de contenu',             en: 'Content Creator',                ar: 'منشئ محتوى'            }, domain: 'Content'      },
  { name: { fr: 'Spécialiste SEO',                 en: 'SEO Specialist',                 ar: 'متخصص SEO'             }, domain: 'SEO'          },
  { name: { fr: 'Responsable Marketing Digital',   en: 'Digital Marketing Manager',      ar: 'مدير التسويق'          }, domain: 'Management'   },
  { name: { fr: 'Growth Hacker',                   en: 'Growth Hacker',                  ar: 'متخصص النمو'           }, domain: 'Performance'  },
  { name: { fr: 'Spécialiste Email Marketing',     en: 'Email Marketing Specialist',     ar: 'متخصص البريد'          }, domain: 'Email'        },
  { name: { fr: 'Chargé de publicité digitale',    en: 'Digital Ads Specialist',         ar: 'متخصص الإعلانات'       }, domain: 'Paid Ads'     },
  { name: { fr: 'Brand Strategist',                en: 'Brand Strategist',               ar: 'استراتيجي العلامة'     }, domain: 'Brand'        },
  { name: { fr: 'Spécialiste Influence Marketing', en: 'Influencer Marketing Specialist',ar: 'متخصص المؤثرين'        }, domain: 'Influence'    },
];

const programsData = [
  { title: { fr: 'Formation Social Media Marketing',  en: 'Social Media Marketing Program',  ar: 'برنامج تسويق التواصل'  }, career: 'Responsable Social Media',        skill: 'Social Media Marketing'      },
  { title: { fr: 'Formation SEO & Référencement',     en: 'SEO & Search Ranking Program',     ar: 'برنامج تحسين البحث'    }, career: 'Spécialiste SEO',                 skill: 'SEO / Référencement naturel'  },
  { title: { fr: 'Formation Content Marketing',       en: 'Content Marketing Program',        ar: 'برنامج تسويق المحتوى'  }, career: 'Créateur de contenu',             skill: 'Marketing de contenu'         },
  { title: { fr: 'Formation Email Marketing',         en: 'Email Marketing Program',          ar: 'برنامج البريد'          }, career: 'Spécialiste Email Marketing',     skill: 'Email Marketing'              },
  { title: { fr: 'Formation Google Ads & Paid Media', en: 'Google Ads & Paid Media Program',  ar: 'برنامج إعلانات جوجل'   }, career: 'Chargé de publicité digitale',    skill: 'SEA / Google Ads'             },
  { title: { fr: 'Formation Analytics & Data Driven', en: 'Analytics & Data-Driven Marketing',ar: 'برنامج التحليلات'       }, career: 'Responsable Marketing Digital',   skill: 'Analyse web / Analytics'      },
  { title: { fr: 'Formation Community Management',    en: 'Community Management Program',     ar: 'برنامج إدارة المجتمع'  }, career: 'Community Manager',               skill: 'Community Management'         },
  { title: { fr: 'Formation Marketing d\'influence',  en: 'Influencer Marketing Program',     ar: 'برنامج المؤثرين'        }, career: 'Spécialiste Influence Marketing', skill: 'Marketing d\'influence'       },
];

const workingModesData = [
  { name: { fr: 'Présentiel',  en: 'On-site', ar: 'حضوري'  }, description: { fr: 'Travail en entreprise',       en: 'Work on-site',   ar: 'عمل في المقر'  } },
  { name: { fr: 'Télétravail', en: 'Remote',  ar: 'عن بُعد' }, description: { fr: 'Travail à distance',          en: 'Work remotely',  ar: 'عمل عن بُعد'   } },
  { name: { fr: 'Hybride',     en: 'Hybrid',  ar: 'هجين'   }, description: { fr: 'Mix présentiel/télétravail',   en: 'Mix on-site/remote', ar: 'مزيج'       } },
];

const jobOfferModelsData = [
  { name: { fr: 'CDI',        en: 'Permanent Contract',  ar: 'عقد دائم'       } },
  { name: { fr: 'CDD',        en: 'Fixed-term Contract', ar: 'عقد محدد المدة' } },
  { name: { fr: 'Stage',      en: 'Internship',          ar: 'تدريب'          } },
  { name: { fr: 'Alternance', en: 'Apprenticeship',      ar: 'تكوين متناوب'   } },
  { name: { fr: 'Freelance',  en: 'Freelance',           ar: 'مستقل'          } },
];

// ── Seed Function ─────────────────────────────────────────────
async function seed() {
  await mongoose.connect(process.env.MONGO_URI!);
  console.log('✅ MongoDB connecté');

  await Promise.all([
    User.deleteMany({}), Company.deleteMany({}),
    Language.deleteMany({}), Country.deleteMany({}),
    HardSkill.deleteMany({}), SoftwareSkill.deleteMany({}),
    FocusedSkill.deleteMany({}), Program.deleteMany({}),
    WorkingMode.deleteMany({}), JobOfferModel.deleteMany({}),
    Career.deleteMany({}), Quiz.deleteMany({}),
    TextBloc.deleteMany({}), VideoYoutube.deleteMany({}),
    JobOffer.deleteMany({}), Application.deleteMany({}),
    Interview.deleteMany({}), Task.deleteMany({}),
    TaskResponse.deleteMany({}), Inscription.deleteMany({}),
  ]);
  console.log('🗑️  Collections nettoyées');

  const [, , hardSkills, softSkills, , programs, workingModes, jobModels] =
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
  console.log('✅ Référentiel inséré');

  // ── Skill ID maps ─────────────────────────────────────────────
  const hs: Record<string, mongoose.Types.ObjectId> = {};
  hardSkills.forEach((s: any) => { hs[s.name.fr] = s._id; hs[s.name.en] = s._id; });
  const sw: Record<string, mongoose.Types.ObjectId> = {};
  softSkills.forEach((s: any) => { sw[s.name.fr] = s._id; sw[s.name.en] = s._id; });

  // ── Quizzes (format correct selon le schéma Quiz) ────────────
  const mkQ = (frText: string, enText: string, opts: {fr: string, en: string, score: number}[]) => ({
    text: { fr: frText, en: enText },
    options: opts.map(o => ({ text: { fr: o.fr, en: o.en }, score: o.score })),
  });
  const quizzes = await Quiz.insertMany([
    { title: { fr: 'Quiz Social Media Marketing', en: 'Social Media Marketing Quiz' }, online: true, duration: 15, deadLineInHours: 72, keyWords: ['social media', 'KPI', 'engagement'],
      sections: [{ text: { fr: 'Fondamentaux', en: 'Fundamentals' }, questions: [
        mkQ('Quelle métrique mesure l\'engagement sur Instagram ?', 'Which metric measures Instagram engagement?', [{fr:'Impressions',en:'Impressions',score:0},{fr:'Taux d\'engagement',en:'Engagement rate',score:10},{fr:'Portée',en:'Reach',score:0},{fr:'CPM',en:'CPM',score:0}]),
        mkQ('Quel format booste le plus la portée sur Facebook ?', 'Which format boosts Facebook reach most?', [{fr:'Texte',en:'Text',score:0},{fr:'Image',en:'Image',score:0},{fr:'Vidéo native',en:'Native video',score:10},{fr:'Lien',en:'Link',score:0}]),
        mkQ('Fréquence idéale de publication sur LinkedIn ?', 'Ideal LinkedIn posting frequency?', [{fr:'10/jour',en:'10/day',score:0},{fr:'1/semaine',en:'1/week',score:0},{fr:'3-5/semaine',en:'3-5/week',score:10},{fr:'1/mois',en:'1/month',score:0}]),
      ]}],
    },
    { title: { fr: 'Quiz SEO & Référencement', en: 'SEO Quiz' }, online: true, duration: 15, deadLineInHours: 72, keyWords: ['SEO', 'backlink', 'Google'],
      sections: [{ text: { fr: 'Bases du SEO', en: 'SEO Basics' }, questions: [
        mkQ('Que signifie SEO ?', 'What does SEO stand for?', [{fr:'Social Engine Opt.',en:'Social Engine Opt.',score:0},{fr:'Search Engine Opt.',en:'Search Engine Opt.',score:10},{fr:'Search Engine Op.',en:'Search Engine Op.',score:0},{fr:'Social Exchange',en:'Social Exchange',score:0}]),
        mkQ('Quel outil Google suit les performances SEO ?', 'Which Google tool tracks SEO performance?', [{fr:'Google Ads',en:'Google Ads',score:0},{fr:'Google Analytics',en:'Google Analytics',score:0},{fr:'Search Console',en:'Search Console',score:10},{fr:'Tag Manager',en:'Tag Manager',score:0}]),
        mkQ('Qu\'est-ce qu\'un backlink ?', 'What is a backlink?', [{fr:'Lien interne',en:'Internal link',score:0},{fr:'Lien externe entrant',en:'Inbound external link',score:10},{fr:'Bouton retour',en:'Back button',score:0},{fr:'Lien brisé',en:'Broken link',score:0}]),
      ]}],
    },
    { title: { fr: 'Quiz Content Marketing', en: 'Content Marketing Quiz' }, online: true, duration: 10, deadLineInHours: 72, keyWords: ['content', 'storytelling', 'engagement'],
      sections: [{ text: { fr: 'Stratégie contenu', en: 'Content Strategy' }, questions: [
        mkQ('Objectif principal du content marketing ?', 'Main goal of content marketing?', [{fr:'Vendre directement',en:'Sell directly',score:0},{fr:'Attirer et fidéliser',en:'Attract & retain',score:10},{fr:'Pub payante',en:'Run paid ads',score:0},{fr:'SEO uniquement',en:'SEO only',score:0}]),
        mkQ('Qu\'est-ce que le storytelling ?', 'What is storytelling?', [{fr:'Écrire des blogs',en:'Writing blogs',score:0},{fr:'Raconter une histoire de marque',en:'Brand storytelling',score:10},{fr:'Créer des pubs vidéo',en:'Video ads',score:0},{fr:'Rédiger des emails',en:'Writing emails',score:0}]),
        mkQ('Format de contenu le plus engageant ?', 'Most engaging content format?', [{fr:'Texte long',en:'Long text',score:0},{fr:'Infographie',en:'Infographic',score:0},{fr:'Vidéo courte',en:'Short video',score:10},{fr:'Podcast',en:'Podcast',score:0}]),
      ]}],
    },
    { title: { fr: 'Quiz Email Marketing', en: 'Email Marketing Quiz' }, online: true, duration: 10, deadLineInHours: 72, keyWords: ['email', 'open rate', 'A/B testing'],
      sections: [{ text: { fr: 'Email Marketing', en: 'Email Marketing' }, questions: [
        mkQ('Qu\'est-ce que le taux d\'ouverture ?', 'What is the open rate?', [{fr:'% emails reçus',en:'% received',score:0},{fr:'% emails ouverts/envoyés',en:'% opened/sent',score:10},{fr:'% de clics',en:'% clicks',score:0},{fr:'% désinscriptions',en:'% unsubscribes',score:0}]),
        mkQ('Plateforme qui domine l\'email marketing ?', 'Dominant email marketing platform?', [{fr:'Notion',en:'Notion',score:0},{fr:'Slack',en:'Slack',score:0},{fr:'Mailchimp',en:'Mailchimp',score:10},{fr:'Figma',en:'Figma',score:0}]),
        mkQ('Qu\'est-ce que l\'A/B testing en emailing ?', 'What is A/B testing in email?', [{fr:'Tester 2 designs',en:'Test 2 designs',score:0},{fr:'Comparer 2 versions d\'email',en:'Compare 2 email versions',score:10},{fr:'Tester la délivrabilité',en:'Test deliverability',score:0},{fr:'Mesurer les ouvertures',en:'Measure opens',score:0}]),
      ]}],
    },
    { title: { fr: 'Quiz Google Ads & Paid Media', en: 'Google Ads Quiz' }, online: true, duration: 10, deadLineInHours: 72, keyWords: ['CPC', 'ROAS', 'Google Ads'],
      sections: [{ text: { fr: 'Publicité digitale', en: 'Digital Advertising' }, questions: [
        mkQ('Que signifie CPC ?', 'What is CPC?', [{fr:'Cost Per Click',en:'Cost Per Click',score:10},{fr:'Content Per Campaign',en:'Content Per Campaign',score:0},{fr:'Click Per Customer',en:'Click Per Customer',score:0},{fr:'Cost Per Content',en:'Cost Per Content',score:0}]),
        mkQ('Réseau pub le plus utilisé ?', 'Most used ad network?', [{fr:'Bing Ads',en:'Bing Ads',score:0},{fr:'Twitter Ads',en:'Twitter Ads',score:0},{fr:'Google Ads',en:'Google Ads',score:10},{fr:'TikTok Ads',en:'TikTok Ads',score:0}]),
        mkQ('Qu\'est-ce que le ROAS ?', 'What is ROAS?', [{fr:'Return on Ad Spend',en:'Return on Ad Spend',score:10},{fr:'Rate of Ad Success',en:'Rate of Ad Success',score:0},{fr:'Revenue on All Sales',en:'Revenue on All Sales',score:0},{fr:'Return on Assets',en:'Return on Assets',score:0}]),
      ]}],
    },
    { title: { fr: 'Quiz Analytics & Data', en: 'Analytics & Data Quiz' }, online: true, duration: 15, deadLineInHours: 72, keyWords: ['Google Analytics', 'conversion', 'KPI'],
      sections: [{ text: { fr: 'Analyse web', en: 'Web Analytics' }, questions: [
        mkQ('Qu\'est-ce qu\'une session Google Analytics ?', 'What is a GA session?', [{fr:'Une page vue',en:'A page view',score:0},{fr:'Un groupe d\'interactions utilisateur',en:'A group of user interactions',score:10},{fr:'Un clic',en:'A click',score:0},{fr:'Une conversion',en:'A conversion',score:0}]),
        mkQ('Qu\'est-ce que le taux de conversion ?', 'What is conversion rate?', [{fr:'% visites/ventes',en:'% visits/sales',score:0},{fr:'% objectifs atteints/visites',en:'% goals/visits',score:10},{fr:'% clics/impressions',en:'% clicks/impressions',score:0},{fr:'% pages vues',en:'% page views',score:0}]),
        mkQ('Qu\'est-ce qu\'un entonnoir de conversion ?', 'What is a conversion funnel?', [{fr:'Outil de design',en:'Design tool',score:0},{fr:'Parcours utilisateur vers l\'achat',en:'User journey to purchase',score:10},{fr:'Filtre analytics',en:'Analytics filter',score:0},{fr:'Rapport mensuel',en:'Monthly report',score:0}]),
      ]}],
    },
    { title: { fr: 'Quiz Community Management', en: 'Community Management Quiz' }, online: true, duration: 10, deadLineInHours: 72, keyWords: ['community', 'social listening', 'modération'],
      sections: [{ text: { fr: 'Gestion de communauté', en: 'Community Management' }, questions: [
        mkQ('Qu\'est-ce qu\'une charte éditoriale ?', 'What is an editorial charter?', [{fr:'Contrat légal',en:'Legal contract',score:0},{fr:'Guide de tone of voice & contenu',en:'Tone & content guide',score:10},{fr:'Un calendrier',en:'A calendar',score:0},{fr:'Budget pub',en:'Ad budget',score:0}]),
        mkQ('Comment gérer un commentaire négatif ?', 'How to handle a negative comment?', [{fr:'Supprimer',en:'Delete',score:0},{fr:'Ignorer',en:'Ignore',score:0},{fr:'Répondre avec empathie',en:'Reply with empathy',score:10},{fr:'Bloquer',en:'Block',score:0}]),
        mkQ('Qu\'est-ce que le social listening ?', 'What is social listening?', [{fr:'Écouter les podcasts',en:'Listen to podcasts',score:0},{fr:'Surveiller les mentions de marque',en:'Monitor brand mentions',score:10},{fr:'Créer des stories',en:'Create stories',score:0},{fr:'Gérer les DMs',en:'Manage DMs',score:0}]),
      ]}],
    },
    { title: { fr: 'Quiz Marketing d\'Influence', en: 'Influencer Marketing Quiz' }, online: true, duration: 10, deadLineInHours: 72, keyWords: ['influenceur', 'micro-influenceur', 'KPI'],
      sections: [{ text: { fr: 'Marketing d\'influence', en: 'Influencer Marketing' }, questions: [
        mkQ('Qu\'est-ce qu\'un micro-influenceur ?', 'What is a micro-influencer?', [{fr:'1M+ abonnés',en:'1M+ followers',score:0},{fr:'10K–100K abonnés',en:'10K–100K followers',score:10},{fr:'Moins de 1K',en:'Under 1K',score:0},{fr:'100K–1M',en:'100K–1M',score:0}]),
        mkQ('KPI qui mesure l\'authenticité d\'un influenceur ?', 'KPI measuring influencer authenticity?', [{fr:'Nombre d\'abonnés',en:'Followers count',score:0},{fr:'Taux d\'engagement',en:'Engagement rate',score:10},{fr:'Portée',en:'Reach',score:0},{fr:'Impressions',en:'Impressions',score:0}]),
        mkQ('Que doit comporter un brief influenceur ?', 'What must an influencer brief include?', [{fr:'Juste un budget',en:'Just a budget',score:0},{fr:'Objectifs, messages clés, contraintes créatives',en:'Objectives, key messages, creative constraints',score:10},{fr:'Seulement la date',en:'Only the date',score:0},{fr:'Contrat légal seulement',en:'Legal contract only',score:0}]),
      ]}],
    },
  ]);
  console.log('✅ 8 quiz créés');

  // ── TextBlocs (contenu texte/HTML par programme) ──────────────
  const textBlocs = await TextBloc.insertMany([
    { title: { fr: 'Introduction au Social Media Marketing', en: 'Intro to Social Media Marketing' }, online: true, keyWords: ['social media', 'marketing', 'réseaux sociaux'], html: '<h2>Bienvenue dans le Social Media Marketing</h2><p>Le Social Media Marketing consiste à utiliser les réseaux sociaux pour promouvoir votre marque, engager votre audience et générer des conversions. Dans ce module, vous découvrirez les fondamentaux : choisir les bons réseaux, créer du contenu engageant et analyser vos performances.</p><ul><li><strong>Instagram</strong> : idéal pour le visuel et les stories</li><li><strong>LinkedIn</strong> : parfait pour le B2B et le personal branding</li><li><strong>Facebook</strong> : portée large, publicité ciblée</li></ul>' },
    { title: { fr: 'Introduction au SEO', en: 'Intro to SEO' }, online: true, keyWords: ['SEO', 'référencement', 'mots-clés'], html: '<h2>Les bases du SEO</h2><p>Le SEO (Search Engine Optimization) vise à améliorer la visibilité de votre site dans les résultats de recherche organiques. Un bon SEO repose sur trois piliers :</p><ol><li><strong>Technique</strong> : vitesse, mobile, structure</li><li><strong>Contenu</strong> : mots-clés, qualité, fraîcheur</li><li><strong>Popularité</strong> : backlinks, autorité de domaine</li></ol><p>Utilisez Google Search Console pour suivre vos positions et détecter les opportunités.</p>' },
    { title: { fr: 'Stratégie de Content Marketing', en: 'Content Marketing Strategy' }, online: true, keyWords: ['content', 'blog', 'storytelling'], html: '<h2>Créer une stratégie de contenu efficace</h2><p>Le content marketing attire et retient une audience clairement définie. Les étapes clés :</p><ul><li>Définir vos personas et leurs besoins</li><li>Choisir les formats adaptés (blog, vidéo, podcast, infographie)</li><li>Planifier avec un calendrier éditorial</li><li>Mesurer : trafic, partages, taux de conversion</li></ul>' },
    { title: { fr: 'Fondamentaux de l\'Email Marketing', en: 'Email Marketing Fundamentals' }, online: true, keyWords: ['email', 'newsletter', 'automation'], html: '<h2>L\'email marketing en 2024</h2><p>Malgré l\'essor des réseaux sociaux, l\'email reste le canal digital au ROI le plus élevé. Les bonnes pratiques :</p><ul><li><strong>Segmentez</strong> votre liste pour personnaliser les messages</li><li><strong>Optimisez</strong> l\'objet : 40-60 caractères, emoji possible</li><li><strong>Automatisez</strong> : welcome series, relances panier abandonné</li><li><strong>Mesurez</strong> : taux d\'ouverture, clic, désinscription</li></ul>' },
    { title: { fr: 'Introduction à Google Ads', en: 'Intro to Google Ads' }, online: true, keyWords: ['Google Ads', 'CPC', 'campagne'], html: '<h2>Google Ads : la publicité au clic</h2><p>Google Ads permet d\'afficher vos annonces sur Google Search, YouTube et des millions de sites partenaires. Types de campagnes :</p><ul><li><strong>Search</strong> : annonces textuelles sur les requêtes ciblées</li><li><strong>Display</strong> : bannières visuelles sur le réseau display</li><li><strong>Shopping</strong> : fiches produits pour le e-commerce</li><li><strong>YouTube</strong> : publicités vidéo pré-roll et in-stream</li></ul><p>Le CPC moyen varie selon le secteur : de 0,10€ à plus de 10€ par clic.</p>' },
    { title: { fr: 'Comprendre Google Analytics', en: 'Understanding Google Analytics' }, online: true, keyWords: ['analytics', 'KPI', 'données'], html: '<h2>Google Analytics : votre boussole digitale</h2><p>Google Analytics mesure le comportement de vos visiteurs. Les métriques essentielles :</p><ul><li><strong>Sessions</strong> : nombre de visites</li><li><strong>Taux de rebond</strong> : % qui quittent sans interaction</li><li><strong>Durée de session</strong> : temps moyen passé sur le site</li><li><strong>Taux de conversion</strong> : % d\'objectifs atteints</li></ul><p>Créez des entonnoirs de conversion pour identifier où vous perdez vos utilisateurs.</p>' },
    { title: { fr: 'Bases du Community Management', en: 'Community Management Basics' }, online: true, keyWords: ['community', 'modération', 'engagement'], html: '<h2>Gérer une communauté en ligne</h2><p>Le Community Manager est le gardien de l\'image de marque sur les réseaux sociaux. Ses missions :</p><ul><li>Animer les comptes (publications, stories, lives)</li><li>Modérer les commentaires avec tact et empathie</li><li>Gérer les crises et les bad buzz</li><li>Analyser les performances et ajuster la stratégie</li></ul><p>Le social listening (veille des mentions) est indispensable pour réagir rapidement.</p>' },
    { title: { fr: 'Introduction au Marketing d\'Influence', en: 'Intro to Influencer Marketing' }, online: true, keyWords: ['influenceur', 'collaboration', 'UGC'], html: '<h2>Le marketing d\'influence en pratique</h2><p>Collaborer avec des influenceurs permet d\'atteindre des audiences ciblées avec authenticité. Les types d\'influenceurs :</p><ul><li><strong>Nano</strong> (1K–10K) : très fort taux d\'engagement</li><li><strong>Micro</strong> (10K–100K) : niche spécialisée, communauté fidèle</li><li><strong>Macro</strong> (100K–1M) : grande portée</li><li><strong>Mega</strong> (1M+) : célébrités, portée maximale</li></ul><p>Un brief influenceur doit inclure : objectifs, messages clés, contraintes créatives et KPIs attendus.</p>' },
  ]);
  console.log('✅ 8 TextBlocs créés');

  // ── VideoYoutubes (vidéos pédagogiques par programme) ─────────
  const videos = await VideoYoutube.insertMany([
    { title: { fr: 'Stratégie Social Media en 10 min', en: 'Social Media Strategy in 10 min' }, online: true, keyWords: ['social media', 'stratégie'], url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    { title: { fr: 'SEO pour débutants', en: 'SEO for beginners' }, online: true, keyWords: ['SEO', 'référencement'], url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    { title: { fr: 'Content Marketing expliqué', en: 'Content Marketing explained' }, online: true, keyWords: ['content', 'marketing'], url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    { title: { fr: 'Email Marketing : guide complet', en: 'Email Marketing complete guide' }, online: true, keyWords: ['email', 'newsletter'], url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    { title: { fr: 'Google Ads de A à Z', en: 'Google Ads from A to Z' }, online: true, keyWords: ['Google Ads', 'publicité'], url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    { title: { fr: 'Google Analytics 4 : tutoriel', en: 'Google Analytics 4 tutorial' }, online: true, keyWords: ['analytics', 'GA4'], url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    { title: { fr: 'Community Management : bonnes pratiques', en: 'Community Management best practices' }, online: true, keyWords: ['community', 'réseaux sociaux'], url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    { title: { fr: 'Marketing d\'influence : trouver les bons influenceurs', en: 'Influencer Marketing: finding the right influencers' }, online: true, keyWords: ['influenceur', 'collaboration'], url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  ]);
  console.log('✅ 8 VideoYoutubes créés');

  // ── Mise à jour des Programmes avec les semaines (courses) ────
  // program 0=Social Media  1=SEO  2=Content  3=Email  4=Google Ads  5=Analytics  6=Community  7=Influence
  const weekTitles = [
    { fr: 'Semaine 1 – Introduction',  en: 'Week 1 – Introduction'  },
    { fr: 'Semaine 2 – Approfondissement', en: 'Week 2 – Deep Dive' },
  ];
  await Promise.all(
    programs.map((prog: any, i: number) =>
      Program.findByIdAndUpdate(prog._id, {
        online: true,
        courses: [
          { title: weekTitles[0], contents: [
            { contentType: 'TextBloc',     content: textBlocs[i]._id },
            { contentType: 'VideoYoutube', content: videos[i]._id    },
          ]},
          { title: weekTitles[1], contents: [
            { contentType: 'Quiz', content: quizzes[i]._id },
          ]},
        ],
      })
    )
  );
  console.log('✅ 8 programmes mis à jour avec les semaines');

  // ── Company & Users ───────────────────────────────────────────
  const password = await bcrypt.hash('Shape2025!', 10);

  const companyUsers = await User.insertMany([
    { login: 'mediaspark',  email: 'rh@mediaspark.fr',  password, roles: ['COMPANY'], firstName: { fr: 'Sophie'   }, lastName: { fr: 'Martin'  }, verifiedAccount: true },
    { login: 'buzzagency',  email: 'rh@buzzagency.fr',  password, roles: ['COMPANY'], firstName: { fr: 'Julien'   }, lastName: { fr: 'Dupont'  }, verifiedAccount: true },
    { login: 'contentlab',  email: 'hr@contentlab.fr',  password, roles: ['COMPANY'], firstName: { fr: 'Emma'     }, lastName: { fr: 'Bernard' }, verifiedAccount: true },
    { login: 'growthio',    email: 'rh@growthio.fr',    password, roles: ['COMPANY'], firstName: { fr: 'Lucas'    }, lastName: { fr: 'Moreau'  }, verifiedAccount: true },
    { login: 'adboost',     email: 'rh@adboost.fr',     password, roles: ['COMPANY'], firstName: { fr: 'Léa'      }, lastName: { fr: 'Petit'   }, verifiedAccount: true },
  ]);

  const companies = await Company.insertMany([
    { name: { fr: 'Media Spark',     en: 'Media Spark'      }, address: { fr: 'Paris, France'     }, owner: companyUsers[0]._id },
    { name: { fr: 'Buzz Agency',     en: 'Buzz Agency'      }, address: { fr: 'Lyon, France'      }, owner: companyUsers[1]._id },
    { name: { fr: 'Content Lab',     en: 'Content Lab'      }, address: { fr: 'Bordeaux, France'  }, owner: companyUsers[2]._id },
    { name: { fr: 'Growth IO',       en: 'Growth IO'        }, address: { fr: 'Marseille, France' }, owner: companyUsers[3]._id },
    { name: { fr: 'AdBoost Digital', en: 'AdBoost Digital'  }, address: { fr: 'Toulouse, France'  }, owner: companyUsers[4]._id },
  ]);
  console.log('✅ 5 entreprises créées');

  // ── 25 Candidates ─────────────────────────────────────────────
  // Groups: [0-7]=Intern  [8-12]=Hired  [13-16]=Interview  [17-21]=Rejected  [22-24]=Applied
  const candidateRaw = [
    // ── INTERNS (0-7) — registered 150-120 days ago ────────────
    { login: 'sarah.dubois',   email: 'sarah.dubois@example.com',   firstName: { fr: 'Sarah'         }, lastName: { fr: 'Dubois'      }, gender: 1, country: 'FR', workingMode: 'Hybride',     languages: ['fr','en'],
      softSkills: ['Créativité','Communication','Organisation'], createdAt: daysAgo(155),
      hardSkills: [{ skill: hs['Social Media Marketing'], level: 5 }, { skill: hs['Community Management'], level: 4 }, { skill: hs['Copywriting'], level: 3 }],
      softwares:  [{ skill: sw['Hootsuite'], level: 4 }, { skill: sw['Canva'], level: 5 }, { skill: sw['Meta Business Suite'], level: 4 }] },

    { login: 'mohamed.amara',  email: 'mohamed.amara@example.com',  firstName: { fr: 'Mohamed'       }, lastName: { fr: 'Amara'       }, gender: 0, country: 'DZ', workingMode: 'Télétravail', languages: ['fr','en','ar'],
      softSkills: ['Rigueur','Curiosité','Analyse'], createdAt: daysAgo(148),
      hardSkills: [{ skill: hs['SEO / Référencement naturel'], level: 5 }, { skill: hs['Analyse web / Analytics'], level: 4 }, { skill: hs['Marketing de contenu'], level: 3 }],
      softwares:  [{ skill: sw['SEMrush'], level: 5 }, { skill: sw['Ahrefs'], level: 4 }, { skill: sw['Google Search Console'], level: 5 }] },

    { login: 'leila.mansouri', email: 'leila.mansouri@example.com', firstName: { fr: 'Leila'         }, lastName: { fr: 'Mansouri'    }, gender: 1, country: 'MA', workingMode: 'Hybride',     languages: ['fr','en','ar'],
      softSkills: ['Créativité','Rédaction','Organisation'], createdAt: daysAgo(142),
      hardSkills: [{ skill: hs['Marketing de contenu'], level: 5 }, { skill: hs['Copywriting'], level: 5 }, { skill: hs['Création de contenu vidéo'], level: 4 }],
      softwares:  [{ skill: sw['Canva'], level: 5 }, { skill: sw['Adobe Premiere Pro'], level: 3 }, { skill: sw['WordPress'], level: 4 }] },

    { login: 'thomas.martin',  email: 'thomas.martin@example.com',  firstName: { fr: 'Thomas'        }, lastName: { fr: 'Martin'      }, gender: 0, country: 'FR', workingMode: 'Présentiel',  languages: ['fr','en'],
      softSkills: ['Organisation','Précision','Communication'], createdAt: daysAgo(138),
      hardSkills: [{ skill: hs['Email Marketing'], level: 5 }, { skill: hs['Gestion de campagnes'], level: 4 }, { skill: hs['A/B Testing'], level: 3 }],
      softwares:  [{ skill: sw['Mailchimp'], level: 5 }, { skill: sw['Klaviyo'], level: 4 }, { skill: sw['HubSpot'], level: 3 }] },

    { login: 'fatima.benali',  email: 'fatima.benali@example.com',  firstName: { fr: 'Fatima'        }, lastName: { fr: 'Benali'      }, gender: 1, country: 'DZ', workingMode: 'Hybride',     languages: ['fr','ar'],
      softSkills: ['Adaptabilité','Leadership','Créativité'], createdAt: daysAgo(132),
      hardSkills: [{ skill: hs['Social Media Marketing'], level: 4 }, { skill: hs['Marketing d\'influence'], level: 4 }, { skill: hs['Community Management'], level: 5 }],
      softwares:  [{ skill: sw['Buffer'], level: 4 }, { skill: sw['Canva'], level: 5 }, { skill: sw['Meta Business Suite'], level: 4 }] },

    { login: 'lucas.bernard',  email: 'lucas.bernard@example.com',  firstName: { fr: 'Lucas'         }, lastName: { fr: 'Bernard'     }, gender: 0, country: 'BE', workingMode: 'Télétravail', languages: ['fr','en'],
      softSkills: ['Analyse','Innovation','Autonomie'], createdAt: daysAgo(128),
      hardSkills: [{ skill: hs['Analyse web / Analytics'], level: 5 }, { skill: hs['A/B Testing'], level: 5 }, { skill: hs['Growth Hacking'], level: 4 }],
      softwares:  [{ skill: sw['Google Analytics'], level: 5 }, { skill: sw['Google Search Console'], level: 4 }, { skill: sw['Notion'], level: 4 }] },

    { login: 'yasmine.khelifi',email: 'yasmine.khelifi@example.com',firstName: { fr: 'Yasmine'       }, lastName: { fr: 'Khelifi'     }, gender: 1, country: 'TN', workingMode: 'Hybride',     languages: ['fr','en','ar'],
      softSkills: ['Rigueur','Présentation','Communication'], createdAt: daysAgo(124),
      hardSkills: [{ skill: hs['SEO / Référencement naturel'], level: 4 }, { skill: hs['Stratégie digitale'], level: 3 }, { skill: hs['Analyse web / Analytics'], level: 4 }],
      softwares:  [{ skill: sw['SEMrush'], level: 4 }, { skill: sw['Google Analytics'], level: 4 }, { skill: sw['Notion'], level: 3 }] },

    { login: 'antoine.dupont', email: 'antoine.dupont@example.com', firstName: { fr: 'Antoine'       }, lastName: { fr: 'Dupont'      }, gender: 0, country: 'FR', workingMode: 'Présentiel',  languages: ['fr','en'],
      softSkills: ['Créativité','Storytelling','Polyvalence'], createdAt: daysAgo(120),
      hardSkills: [{ skill: hs['Copywriting'], level: 5 }, { skill: hs['Marketing de contenu'], level: 4 }, { skill: hs['Création de contenu vidéo'], level: 3 }],
      softwares:  [{ skill: sw['Adobe Premiere Pro'], level: 4 }, { skill: sw['Canva'], level: 4 }, { skill: sw['WordPress'], level: 3 }] },

    // ── HIRED (8-12) — registered 115-90 days ago ──────────────
    { login: 'amira.touati',   email: 'amira.touati@example.com',   firstName: { fr: 'Amira'         }, lastName: { fr: 'Touati'      }, gender: 1, country: 'DZ', workingMode: 'Hybride',     languages: ['fr','ar'],
      softSkills: ['Précision','Organisation','Communication'], createdAt: daysAgo(114),
      hardSkills: [{ skill: hs['Email Marketing'], level: 4 }, { skill: hs['A/B Testing'], level: 3 }, { skill: hs['Gestion de campagnes'], level: 4 }],
      softwares:  [{ skill: sw['Mailchimp'], level: 4 }, { skill: sw['HubSpot'], level: 3 }, { skill: sw['Notion'], level: 4 }] },

    { login: 'mathieu.leroy',  email: 'mathieu.leroy@example.com',  firstName: { fr: 'Mathieu'       }, lastName: { fr: 'Leroy'       }, gender: 0, country: 'FR', workingMode: 'Hybride',     languages: ['fr','en'],
      softSkills: ['Leadership','Communication','Réseau'], createdAt: daysAgo(108),
      hardSkills: [{ skill: hs['Social Media Marketing'], level: 4 }, { skill: hs['Community Management'], level: 5 }, { skill: hs['Stratégie digitale'], level: 3 }],
      softwares:  [{ skill: sw['Hootsuite'], level: 4 }, { skill: sw['Meta Business Suite'], level: 5 }, { skill: sw['Canva'], level: 3 }] },

    { login: 'rania.saidi',    email: 'rania.saidi@example.com',    firstName: { fr: 'Rania'         }, lastName: { fr: 'Saidi'       }, gender: 1, country: 'MA', workingMode: 'Télétravail', languages: ['fr','en','ar'],
      softSkills: ['Analyse','Rigueur','Innovation'], createdAt: daysAgo(102),
      hardSkills: [{ skill: hs['Growth Hacking'], level: 4 }, { skill: hs['Analyse web / Analytics'], level: 4 }, { skill: hs['E-commerce & conversion'], level: 3 }],
      softwares:  [{ skill: sw['Google Analytics'], level: 4 }, { skill: sw['HubSpot'], level: 4 }, { skill: sw['Shopify'], level: 3 }] },

    { login: 'kevin.moreau',   email: 'kevin.moreau@example.com',   firstName: { fr: 'Kevin'         }, lastName: { fr: 'Moreau'      }, gender: 0, country: 'BE', workingMode: 'Hybride',     languages: ['fr','en'],
      softSkills: ['Créativité','Rédaction','Polyvalence'], createdAt: daysAgo(96),
      hardSkills: [{ skill: hs['Marketing de contenu'], level: 4 }, { skill: hs['Copywriting'], level: 4 }, { skill: hs['Création de contenu vidéo'], level: 3 }],
      softwares:  [{ skill: sw['Canva'], level: 4 }, { skill: sw['WordPress'], level: 4 }, { skill: sw['CapCut'], level: 3 }] },

    { login: 'houda.chakroun', email: 'houda.chakroun@example.com', firstName: { fr: 'Houda'         }, lastName: { fr: 'Chakroun'    }, gender: 1, country: 'TN', workingMode: 'Télétravail', languages: ['fr','en','ar'],
      softSkills: ['Rigueur','Curiosité','Résultats'], createdAt: daysAgo(90),
      hardSkills: [{ skill: hs['SEO / Référencement naturel'], level: 4 }, { skill: hs['Marketing de contenu'], level: 3 }, { skill: hs['Analyse web / Analytics'], level: 3 }],
      softwares:  [{ skill: sw['SEMrush'], level: 3 }, { skill: sw['Google Search Console'], level: 4 }, { skill: sw['Ahrefs'], level: 3 }] },

    // ── INTERVIEW (13-16) — registered 85-65 days ago ──────────
    { login: 'pierre.lambert', email: 'pierre.lambert@example.com', firstName: { fr: 'Pierre'        }, lastName: { fr: 'Lambert'     }, gender: 0, country: 'FR', workingMode: 'Hybride',     languages: ['fr','en'],
      softSkills: ['Communication','Créativité','Organisation'], createdAt: daysAgo(84),
      hardSkills: [{ skill: hs['Social Media Marketing'], level: 3 }, { skill: hs['Community Management'], level: 3 }, { skill: hs['Copywriting'], level: 3 }],
      softwares:  [{ skill: sw['Hootsuite'], level: 3 }, { skill: sw['Canva'], level: 3 }, { skill: sw['Buffer'], level: 2 }] },

    { login: 'nadia.bouzid',   email: 'nadia.bouzid@example.com',   firstName: { fr: 'Nadia'         }, lastName: { fr: 'Bouzid'      }, gender: 1, country: 'DZ', workingMode: 'Télétravail', languages: ['fr','ar'],
      softSkills: ['Analyse','Précision','Autonomie'], createdAt: daysAgo(78),
      hardSkills: [{ skill: hs['Analyse web / Analytics'], level: 4 }, { skill: hs['A/B Testing'], level: 3 }, { skill: hs['Growth Hacking'], level: 2 }],
      softwares:  [{ skill: sw['Google Analytics'], level: 4 }, { skill: sw['Notion'], level: 3 }, { skill: sw['HubSpot'], level: 2 }] },

    { login: 'jb.petit',       email: 'jb.petit@example.com',       firstName: { fr: 'Jean-Baptiste' }, lastName: { fr: 'Petit'       }, gender: 0, country: 'CA', workingMode: 'Télétravail', languages: ['fr','en'],
      softSkills: ['Créativité','Storytelling','Rédaction'], createdAt: daysAgo(72),
      hardSkills: [{ skill: hs['Marketing de contenu'], level: 3 }, { skill: hs['Copywriting'], level: 3 }, { skill: hs['Création de contenu vidéo'], level: 2 }],
      softwares:  [{ skill: sw['Canva'], level: 3 }, { skill: sw['WordPress'], level: 3 }, { skill: sw['Adobe Premiere Pro'], level: 2 }] },

    { login: 'samira.hadj',    email: 'samira.hadj@example.com',    firstName: { fr: 'Samira'        }, lastName: { fr: 'Hadj'        }, gender: 1, country: 'DZ', workingMode: 'Présentiel',  languages: ['fr','ar'],
      softSkills: ['Organisation','Précision','Communication'], createdAt: daysAgo(66),
      hardSkills: [{ skill: hs['Email Marketing'], level: 3 }, { skill: hs['Gestion de campagnes'], level: 2 }, { skill: hs['A/B Testing'], level: 2 }],
      softwares:  [{ skill: sw['Mailchimp'], level: 3 }, { skill: sw['HubSpot'], level: 2 }, { skill: sw['Notion'], level: 2 }] },

    // ── REJECTED (17-21) — registered 60-38 days ago ───────────
    { login: 'david.richard',  email: 'david.richard@example.com',  firstName: { fr: 'David'         }, lastName: { fr: 'Richard'     }, gender: 0, country: 'FR', workingMode: 'Hybride',     languages: ['fr'],
      softSkills: ['Communication','Adaptabilité'], createdAt: daysAgo(59),
      hardSkills: [{ skill: hs['Social Media Marketing'], level: 2 }, { skill: hs['Community Management'], level: 2 }],
      softwares:  [{ skill: sw['Canva'], level: 2 }, { skill: sw['Meta Business Suite'], level: 1 }] },

    { login: 'meriem.trabelsi',email: 'meriem.trabelsi@example.com',firstName: { fr: 'Meriem'        }, lastName: { fr: 'Trabelsi'    }, gender: 1, country: 'TN', workingMode: 'Télétravail', languages: ['fr','ar'],
      softSkills: ['Rigueur','Curiosité'], createdAt: daysAgo(54),
      hardSkills: [{ skill: hs['SEO / Référencement naturel'], level: 2 }, { skill: hs['Analyse web / Analytics'], level: 2 }],
      softwares:  [{ skill: sw['Google Search Console'], level: 2 }, { skill: sw['SEMrush'], level: 1 }] },

    { login: 'theo.fontaine',  email: 'theo.fontaine@example.com',  firstName: { fr: 'Théo'          }, lastName: { fr: 'Fontaine'    }, gender: 0, country: 'FR', workingMode: 'Présentiel',  languages: ['fr'],
      softSkills: ['Créativité','Initiative'], createdAt: daysAgo(49),
      hardSkills: [{ skill: hs['Marketing de contenu'], level: 2 }, { skill: hs['Copywriting'], level: 2 }],
      softwares:  [{ skill: sw['Canva'], level: 2 }, { skill: sw['WordPress'], level: 1 }] },

    { login: 'imane.bensalem', email: 'imane.bensalem@example.com', firstName: { fr: 'Imane'         }, lastName: { fr: 'Bensalem'    }, gender: 1, country: 'MA', workingMode: 'Hybride',     languages: ['fr','ar'],
      softSkills: ['Organisation','Précision'], createdAt: daysAgo(44),
      hardSkills: [{ skill: hs['Email Marketing'], level: 2 }, { skill: hs['Gestion de campagnes'], level: 1 }],
      softwares:  [{ skill: sw['Mailchimp'], level: 2 }, { skill: sw['Notion'], level: 1 }] },

    { login: 'clement.rousseau',email:'clement.rousseau@example.com',firstName: { fr: 'Clément'      }, lastName: { fr: 'Rousseau'    }, gender: 0, country: 'FR', workingMode: 'Télétravail', languages: ['fr','en'],
      softSkills: ['Analyse','Innovation'], createdAt: daysAgo(38),
      hardSkills: [{ skill: hs['Growth Hacking'], level: 2 }, { skill: hs['SEA / Google Ads'], level: 2 }],
      softwares:  [{ skill: sw['Google Analytics'], level: 2 }, { skill: sw['Google Ads Editor'], level: 1 }] },

    // ── APPLIED (22-24) — registered 30-15 days ago ────────────
    { login: 'asma.meziani',   email: 'asma.meziani@example.com',   firstName: { fr: 'Asma'          }, lastName: { fr: 'Meziani'     }, gender: 1, country: 'DZ', workingMode: 'Hybride',     languages: ['fr','ar'],
      softSkills: ['Créativité','Communication','Adaptabilité'], createdAt: daysAgo(28),
      hardSkills: [{ skill: hs['Social Media Marketing'], level: 3 }, { skill: hs['Community Management'], level: 3 }, { skill: hs['Marketing d\'influence'], level: 2 }],
      softwares:  [{ skill: sw['Canva'], level: 3 }, { skill: sw['Meta Business Suite'], level: 3 }, { skill: sw['Buffer'], level: 2 }] },

    { login: 'hugo.garnier',   email: 'hugo.garnier@example.com',   firstName: { fr: 'Hugo'          }, lastName: { fr: 'Garnier'     }, gender: 0, country: 'FR', workingMode: 'Télétravail', languages: ['fr','en'],
      softSkills: ['Rigueur','Analyse','Curiosité'], createdAt: daysAgo(21),
      hardSkills: [{ skill: hs['SEO / Référencement naturel'], level: 3 }, { skill: hs['Analyse web / Analytics'], level: 3 }, { skill: hs['A/B Testing'], level: 2 }],
      softwares:  [{ skill: sw['SEMrush'], level: 3 }, { skill: sw['Google Analytics'], level: 3 }, { skill: sw['Google Search Console'], level: 2 }] },

    { login: 'sonia.cherif',   email: 'sonia.cherif@example.com',   firstName: { fr: 'Sonia'         }, lastName: { fr: 'Cherif'      }, gender: 1, country: 'TN', workingMode: 'Hybride',     languages: ['fr','en','ar'],
      softSkills: ['Créativité','Rédaction','Organisation'], createdAt: daysAgo(15),
      hardSkills: [{ skill: hs['Marketing de contenu'], level: 3 }, { skill: hs['Copywriting'], level: 3 }, { skill: hs['Création de contenu vidéo'], level: 2 }],
      softwares:  [{ skill: sw['Canva'], level: 3 }, { skill: sw['WordPress'], level: 2 }, { skill: sw['CapCut'], level: 2 }] },
  ];

  const candidates = await User.insertMany(
    candidateRaw.map(c => ({ ...c, password, roles: ['CANDIDATE'], verifiedAccount: true }))
  );
  console.log(`✅ ${candidates.length} candidats créés`);

  // ── Job Offers (5, all MediaSpark) ────────────────────────────
  const jobOffers = await JobOffer.insertMany([
    {
      company: companies[0]._id, workingMode: workingModes[2]._id, jobOfferModel: jobModels[0]._id,
      title: 'Social Media Manager',
      description: 'Gérez nos réseaux sociaux et développez notre communauté en ligne pour nos marques clientes.',
      whoAreThey: 'Agence digitale leader en France avec +50 clients premium.',
      requiredProfile: 'Passion pour les réseaux sociaux, créativité, 1+ an d\'expérience.',
      softSkills: ['Créativité','Communication','Organisation'],
      hardSkills: [{ skill: hs['Social Media Marketing'], level: 4 }, { skill: hs['Community Management'], level: 4 }, { skill: hs['Copywriting'], level: 3 }],
      softwareSkills: [{ skill: sw['Hootsuite'], level: 3 }, { skill: sw['Canva'], level: 4 }, { skill: sw['Meta Business Suite'], level: 3 }],
      profilesNeeded: 3, attributes: [], status: 'open',
    },
    {
      company: companies[0]._id, workingMode: workingModes[1]._id, jobOfferModel: jobModels[0]._id,
      title: 'Spécialiste SEO & Analytics',
      description: 'Optimisez notre visibilité organique et analysez les performances digitales.',
      whoAreThey: 'Équipe data-driven avec culture test & learn.',
      requiredProfile: 'Maîtrise des outils SEO, analytique, mindset data.',
      softSkills: ['Rigueur','Analyse','Curiosité'],
      hardSkills: [{ skill: hs['SEO / Référencement naturel'], level: 4 }, { skill: hs['Analyse web / Analytics'], level: 4 }, { skill: hs['A/B Testing'], level: 3 }],
      softwareSkills: [{ skill: sw['SEMrush'], level: 4 }, { skill: sw['Ahrefs'], level: 3 }, { skill: sw['Google Search Console'], level: 4 }],
      profilesNeeded: 2, attributes: [], status: 'open',
    },
    {
      company: companies[0]._id, workingMode: workingModes[2]._id, jobOfferModel: jobModels[1]._id,
      title: 'Créateur de Contenu & Copywriter',
      description: 'Produisez du contenu engageant : articles, scripts vidéo, posts, newsletters.',
      whoAreThey: 'Studio créatif avec liberté éditoriale et projets variés.',
      requiredProfile: 'Plume acérée, œil créatif, portfolio fourni.',
      softSkills: ['Créativité','Rédaction','Polyvalence'],
      hardSkills: [{ skill: hs['Copywriting'], level: 5 }, { skill: hs['Marketing de contenu'], level: 4 }, { skill: hs['Création de contenu vidéo'], level: 3 }],
      softwareSkills: [{ skill: sw['Canva'], level: 4 }, { skill: sw['WordPress'], level: 3 }, { skill: sw['Adobe Premiere Pro'], level: 3 }],
      profilesNeeded: 2, attributes: [], status: 'open',
    },
    {
      company: companies[0]._id, workingMode: workingModes[2]._id, jobOfferModel: jobModels[2]._id,
      title: 'Stage Email Marketing & CRM',
      description: 'Stage 6 mois — créez, automatisez et analysez nos campagnes emailing.',
      whoAreThey: 'Startup SaaS en forte croissance, culture startup agile.',
      requiredProfile: 'Rigueur, curiosité pour les outils CRM, disponible 6 mois.',
      softSkills: ['Organisation','Précision','Autonomie'],
      hardSkills: [{ skill: hs['Email Marketing'], level: 3 }, { skill: hs['Gestion de campagnes'], level: 3 }, { skill: hs['A/B Testing'], level: 2 }],
      softwareSkills: [{ skill: sw['Mailchimp'], level: 3 }, { skill: sw['HubSpot'], level: 2 }, { skill: sw['Klaviyo'], level: 2 }],
      profilesNeeded: 2, attributes: [], status: 'open',
    },
    {
      company: companies[0]._id, workingMode: workingModes[1]._id, jobOfferModel: jobModels[3]._id,
      title: 'Alternance Growth Marketing & Data',
      description: 'Alternance 12 mois — pilotez la croissance avec une approche data-driven.',
      whoAreThey: 'Scale-up e-commerce avec stack analytics avancée.',
      requiredProfile: 'Esprit analytique, intérêt pour le growth hacking et e-commerce.',
      softSkills: ['Analyse','Innovation','Autonomie'],
      hardSkills: [{ skill: hs['Growth Hacking'], level: 3 }, { skill: hs['Analyse web / Analytics'], level: 4 }, { skill: hs['E-commerce & conversion'], level: 3 }],
      softwareSkills: [{ skill: sw['Google Analytics'], level: 3 }, { skill: sw['HubSpot'], level: 2 }, { skill: sw['Shopify'], level: 3 }],
      profilesNeeded: 2, attributes: [], status: 'open',
    },
  ]);
  console.log(`✅ ${jobOffers.length} offres créées`);

  // ── Applications ──────────────────────────────────────────────
  // status: 1=Applied 2=Rejected 3=Interview 4=Hired 5=Intern
  const appData = [
    // Interns [0-7] → status 5
    { user: candidates[0]._id, jobOffer: jobOffers[0]._id, status: 5, matchScore: 91, skillScore: 88, semanticScore: 94, createdAt: daysAgo(148), matchedSkills: ['Social Media Marketing','Community Management','Copywriting'] },
    { user: candidates[1]._id, jobOffer: jobOffers[1]._id, status: 5, matchScore: 88, skillScore: 90, semanticScore: 86, createdAt: daysAgo(141), matchedSkills: ['SEO / Référencement naturel','Analyse web / Analytics'] },
    { user: candidates[2]._id, jobOffer: jobOffers[2]._id, status: 5, matchScore: 85, skillScore: 86, semanticScore: 84, createdAt: daysAgo(135), matchedSkills: ['Copywriting','Marketing de contenu','Création de contenu vidéo'] },
    { user: candidates[3]._id, jobOffer: jobOffers[3]._id, status: 5, matchScore: 82, skillScore: 80, semanticScore: 84, createdAt: daysAgo(131), matchedSkills: ['Email Marketing','Gestion de campagnes','A/B Testing'] },
    { user: candidates[4]._id, jobOffer: jobOffers[0]._id, status: 5, matchScore: 94, skillScore: 92, semanticScore: 96, createdAt: daysAgo(125), matchedSkills: ['Social Media Marketing','Community Management','Marketing d\'influence'] },
    { user: candidates[5]._id, jobOffer: jobOffers[4]._id, status: 5, matchScore: 87, skillScore: 84, semanticScore: 90, createdAt: daysAgo(121), matchedSkills: ['Analyse web / Analytics','Growth Hacking','A/B Testing'] },
    { user: candidates[6]._id, jobOffer: jobOffers[1]._id, status: 5, matchScore: 79, skillScore: 78, semanticScore: 80, createdAt: daysAgo(117), matchedSkills: ['SEO / Référencement naturel','Analyse web / Analytics'] },
    { user: candidates[7]._id, jobOffer: jobOffers[2]._id, status: 5, matchScore: 83, skillScore: 82, semanticScore: 84, createdAt: daysAgo(113), matchedSkills: ['Copywriting','Marketing de contenu'] },
    // Hired [8-12] → status 4
    { user: candidates[8]._id,  jobOffer: jobOffers[3]._id, status: 4, matchScore: 77, skillScore: 75, semanticScore: 79, createdAt: daysAgo(107), matchedSkills: ['Email Marketing','Gestion de campagnes'] },
    { user: candidates[9]._id,  jobOffer: jobOffers[0]._id, status: 4, matchScore: 81, skillScore: 83, semanticScore: 79, createdAt: daysAgo(101), matchedSkills: ['Social Media Marketing','Community Management'] },
    { user: candidates[10]._id, jobOffer: jobOffers[4]._id, status: 4, matchScore: 75, skillScore: 74, semanticScore: 76, createdAt: daysAgo(95),  matchedSkills: ['Growth Hacking','Analyse web / Analytics'] },
    { user: candidates[11]._id, jobOffer: jobOffers[2]._id, status: 4, matchScore: 72, skillScore: 70, semanticScore: 74, createdAt: daysAgo(89),  matchedSkills: ['Marketing de contenu','Copywriting'] },
    { user: candidates[12]._id, jobOffer: jobOffers[1]._id, status: 4, matchScore: 69, skillScore: 68, semanticScore: 70, createdAt: daysAgo(83),  matchedSkills: ['SEO / Référencement naturel'] },
    // Interview [13-16] → status 3
    { user: candidates[13]._id, jobOffer: jobOffers[0]._id, status: 3, matchScore: 66, skillScore: 64, semanticScore: 68, createdAt: daysAgo(77), matchedSkills: ['Social Media Marketing','Community Management'] },
    { user: candidates[14]._id, jobOffer: jobOffers[4]._id, status: 3, matchScore: 71, skillScore: 72, semanticScore: 70, createdAt: daysAgo(71), matchedSkills: ['Analyse web / Analytics','Growth Hacking'] },
    { user: candidates[15]._id, jobOffer: jobOffers[2]._id, status: 3, matchScore: 64, skillScore: 62, semanticScore: 66, createdAt: daysAgo(65), matchedSkills: ['Marketing de contenu','Copywriting'] },
    { user: candidates[16]._id, jobOffer: jobOffers[3]._id, status: 3, matchScore: 68, skillScore: 66, semanticScore: 70, createdAt: daysAgo(59), matchedSkills: ['Email Marketing'] },
    // Rejected [17-21] → status 2
    { user: candidates[17]._id, jobOffer: jobOffers[0]._id, status: 2, matchScore: 43, skillScore: 40, semanticScore: 46, createdAt: daysAgo(52), matchedSkills: [] },
    { user: candidates[18]._id, jobOffer: jobOffers[1]._id, status: 2, matchScore: 38, skillScore: 36, semanticScore: 40, createdAt: daysAgo(47), matchedSkills: [] },
    { user: candidates[19]._id, jobOffer: jobOffers[2]._id, status: 2, matchScore: 47, skillScore: 46, semanticScore: 48, createdAt: daysAgo(42), matchedSkills: ['Copywriting'] },
    { user: candidates[20]._id, jobOffer: jobOffers[3]._id, status: 2, matchScore: 41, skillScore: 39, semanticScore: 43, createdAt: daysAgo(37), matchedSkills: [] },
    { user: candidates[21]._id, jobOffer: jobOffers[4]._id, status: 2, matchScore: 52, skillScore: 50, semanticScore: 54, createdAt: daysAgo(32), matchedSkills: ['Growth Hacking'] },
    // Applied [22-24] → status 1
    { user: candidates[22]._id, jobOffer: jobOffers[0]._id, status: 1, matchScore: 62, skillScore: 61, semanticScore: 63, createdAt: daysAgo(25), matchedSkills: ['Social Media Marketing'] },
    { user: candidates[23]._id, jobOffer: jobOffers[1]._id, status: 1, matchScore: 58, skillScore: 57, semanticScore: 59, createdAt: daysAgo(18), matchedSkills: ['SEO / Référencement naturel'] },
    { user: candidates[24]._id, jobOffer: jobOffers[2]._id, status: 1, matchScore: 60, skillScore: 59, semanticScore: 61, createdAt: daysAgo(12), matchedSkills: ['Copywriting'] },
    // Extra applications (some candidates apply to 2nd offer) → mostly rejected
    { user: candidates[0]._id,  jobOffer: jobOffers[2]._id, status: 2, matchScore: 55, skillScore: 52, semanticScore: 58, createdAt: daysAgo(160), matchedSkills: ['Copywriting'] },
    { user: candidates[3]._id,  jobOffer: jobOffers[0]._id, status: 2, matchScore: 48, skillScore: 45, semanticScore: 51, createdAt: daysAgo(143), matchedSkills: [] },
    { user: candidates[7]._id,  jobOffer: jobOffers[3]._id, status: 2, matchScore: 44, skillScore: 42, semanticScore: 46, createdAt: daysAgo(126), matchedSkills: [] },
    { user: candidates[10]._id, jobOffer: jobOffers[2]._id, status: 2, matchScore: 50, skillScore: 49, semanticScore: 51, createdAt: daysAgo(108), matchedSkills: ['Marketing de contenu'] },
    { user: candidates[14]._id, jobOffer: jobOffers[0]._id, status: 1, matchScore: 57, skillScore: 56, semanticScore: 58, createdAt: daysAgo(74), matchedSkills: [] },
  ];

  const applications = await Application.insertMany(appData);
  console.log(`✅ ${applications.length} candidatures créées`);

  // ── Interviews ────────────────────────────────────────────────
  // Interns (0-7) + Hired (8-12) → completed  |  Interview (13-16) → scheduled
  const interviewData = [
    // Completed — interns
    { applicationId: applications[0]._id, companyId: companies[0]._id, candidateId: candidates[0]._id, jobOfferId: jobOffers[0]._id, scheduledAt: daysAgo(130), channelName: `shape-itv-00`, status: 'completed', confirmedByCandidate: true, confirmedByCompany: true },
    { applicationId: applications[1]._id, companyId: companies[0]._id, candidateId: candidates[1]._id, jobOfferId: jobOffers[1]._id, scheduledAt: daysAgo(124), channelName: `shape-itv-01`, status: 'completed', confirmedByCandidate: true, confirmedByCompany: true },
    { applicationId: applications[2]._id, companyId: companies[0]._id, candidateId: candidates[2]._id, jobOfferId: jobOffers[2]._id, scheduledAt: daysAgo(118), channelName: `shape-itv-02`, status: 'completed', confirmedByCandidate: true, confirmedByCompany: true },
    { applicationId: applications[3]._id, companyId: companies[0]._id, candidateId: candidates[3]._id, jobOfferId: jobOffers[3]._id, scheduledAt: daysAgo(114), channelName: `shape-itv-03`, status: 'completed', confirmedByCandidate: true, confirmedByCompany: true },
    { applicationId: applications[4]._id, companyId: companies[0]._id, candidateId: candidates[4]._id, jobOfferId: jobOffers[0]._id, scheduledAt: daysAgo(108), channelName: `shape-itv-04`, status: 'completed', confirmedByCandidate: true, confirmedByCompany: true },
    { applicationId: applications[5]._id, companyId: companies[0]._id, candidateId: candidates[5]._id, jobOfferId: jobOffers[4]._id, scheduledAt: daysAgo(104), channelName: `shape-itv-05`, status: 'completed', confirmedByCandidate: true, confirmedByCompany: true },
    { applicationId: applications[6]._id, companyId: companies[0]._id, candidateId: candidates[6]._id, jobOfferId: jobOffers[1]._id, scheduledAt: daysAgo(100), channelName: `shape-itv-06`, status: 'completed', confirmedByCandidate: true, confirmedByCompany: true },
    { applicationId: applications[7]._id, companyId: companies[0]._id, candidateId: candidates[7]._id, jobOfferId: jobOffers[2]._id, scheduledAt: daysAgo(96),  channelName: `shape-itv-07`, status: 'completed', confirmedByCandidate: true, confirmedByCompany: true },
    // Completed — hired
    { applicationId: applications[8]._id,  companyId: companies[0]._id, candidateId: candidates[8]._id,  jobOfferId: jobOffers[3]._id, scheduledAt: daysAgo(90),  channelName: `shape-itv-08`, status: 'completed', confirmedByCandidate: true, confirmedByCompany: true },
    { applicationId: applications[9]._id,  companyId: companies[0]._id, candidateId: candidates[9]._id,  jobOfferId: jobOffers[0]._id, scheduledAt: daysAgo(84),  channelName: `shape-itv-09`, status: 'completed', confirmedByCandidate: true, confirmedByCompany: true },
    { applicationId: applications[10]._id, companyId: companies[0]._id, candidateId: candidates[10]._id, jobOfferId: jobOffers[4]._id, scheduledAt: daysAgo(78),  channelName: `shape-itv-10`, status: 'completed', confirmedByCandidate: true, confirmedByCompany: true },
    { applicationId: applications[11]._id, companyId: companies[0]._id, candidateId: candidates[11]._id, jobOfferId: jobOffers[2]._id, scheduledAt: daysAgo(72),  channelName: `shape-itv-11`, status: 'completed', confirmedByCandidate: true, confirmedByCompany: true },
    { applicationId: applications[12]._id, companyId: companies[0]._id, candidateId: candidates[12]._id, jobOfferId: jobOffers[1]._id, scheduledAt: daysAgo(66),  channelName: `shape-itv-12`, status: 'completed', confirmedByCandidate: true, confirmedByCompany: true },
    // Scheduled — interview stage (upcoming)
    { applicationId: applications[13]._id, companyId: companies[0]._id, candidateId: candidates[13]._id, jobOfferId: jobOffers[0]._id, scheduledAt: new Date(Date.now() + 2  * 86_400_000), channelName: `shape-itv-13`, status: 'scheduled', confirmedByCandidate: true,  confirmedByCompany: true  },
    { applicationId: applications[14]._id, companyId: companies[0]._id, candidateId: candidates[14]._id, jobOfferId: jobOffers[4]._id, scheduledAt: new Date(Date.now() + 5  * 86_400_000), channelName: `shape-itv-14`, status: 'scheduled', confirmedByCandidate: false, confirmedByCompany: true  },
    { applicationId: applications[15]._id, companyId: companies[0]._id, candidateId: candidates[15]._id, jobOfferId: jobOffers[2]._id, scheduledAt: new Date(Date.now() + 8  * 86_400_000), channelName: `shape-itv-15`, status: 'scheduled', confirmedByCandidate: true,  confirmedByCompany: false },
    { applicationId: applications[16]._id, companyId: companies[0]._id, candidateId: candidates[16]._id, jobOfferId: jobOffers[3]._id, scheduledAt: new Date(Date.now() + 11 * 86_400_000), channelName: `shape-itv-16`, status: 'scheduled', confirmedByCandidate: false, confirmedByCompany: true  },
    // Cancelled — 2 cases for realism
    { applicationId: applications[17]._id, companyId: companies[0]._id, candidateId: candidates[17]._id, jobOfferId: jobOffers[0]._id, scheduledAt: daysAgo(45), channelName: `shape-itv-17`, status: 'cancelled', confirmedByCandidate: true, confirmedByCompany: true, notes: 'Candidat ne répond plus aux messages.' },
    { applicationId: applications[18]._id, companyId: companies[0]._id, candidateId: candidates[18]._id, jobOfferId: jobOffers[1]._id, scheduledAt: daysAgo(40), channelName: `shape-itv-18`, status: 'cancelled', confirmedByCandidate: false, confirmedByCompany: true, notes: 'Entretien annulé par le candidat.' },
  ];

  const interviews = await Interview.insertMany(interviewData);
  console.log(`✅ ${interviews.length} entretiens créés`);

  // ── Inscriptions (interns + hired enrolled in programs) ───────
  // program 0=Social Media  1=SEO  2=Content  3=Email  4=Google Ads  5=Analytics  6=Community  7=Influence
  const inscriptionData = [
    { user: candidates[0]._id,  programs: [programs[0]._id, programs[6]._id], status: 'active',    createdAt: daysAgo(125) },
    { user: candidates[1]._id,  programs: [programs[1]._id],                  status: 'active',    createdAt: daysAgo(118) },
    { user: candidates[2]._id,  programs: [programs[2]._id],                  status: 'active',    createdAt: daysAgo(112) },
    { user: candidates[3]._id,  programs: [programs[3]._id],                  status: 'completed', createdAt: daysAgo(108) },
    { user: candidates[4]._id,  programs: [programs[0]._id, programs[7]._id], status: 'active',    createdAt: daysAgo(102) },
    { user: candidates[5]._id,  programs: [programs[5]._id, programs[4]._id], status: 'active',    createdAt: daysAgo(98)  },
    { user: candidates[6]._id,  programs: [programs[1]._id],                  status: 'completed', createdAt: daysAgo(94)  },
    { user: candidates[7]._id,  programs: [programs[2]._id],                  status: 'active',    createdAt: daysAgo(90)  },
    { user: candidates[8]._id,  programs: [programs[3]._id],                  status: 'completed', createdAt: daysAgo(84)  },
    { user: candidates[9]._id,  programs: [programs[0]._id],                  status: 'completed', createdAt: daysAgo(78)  },
    { user: candidates[10]._id, programs: [programs[5]._id],                  status: 'active',    createdAt: daysAgo(72)  },
    { user: candidates[11]._id, programs: [programs[2]._id],                  status: 'active',    createdAt: daysAgo(66)  },
    { user: candidates[12]._id, programs: [programs[1]._id],                  status: 'active',    createdAt: daysAgo(60)  },
  ];
  await Inscription.insertMany(inscriptionData);
  console.log('✅ 16 inscriptions créées');

  // ── Tasks (20 tasks across various domains) ───────────────────
  const tasks = await Task.insertMany([
    // Social Media tasks
    { title: { fr: 'Créer un calendrier éditorial mensuel',  en: 'Create monthly editorial calendar'  }, description: { fr: 'Planifier 30 publications sur Instagram, LinkedIn et Facebook pour le mois prochain.', en: 'Plan 30 posts across Instagram, LinkedIn and Facebook for next month.' }, deadLineInHours: 48,  createdAt: daysAgo(90) },
    { title: { fr: 'Rédiger 10 captions Instagram',         en: 'Write 10 Instagram captions'         }, description: { fr: 'Captions engageantes avec hashtags optimisés pour les stories et posts.', en: 'Engaging captions with optimized hashtags for stories and posts.' }, deadLineInHours: 24,  createdAt: daysAgo(85) },
    { title: { fr: 'Audit de la page LinkedIn',             en: 'LinkedIn page audit'                 }, description: { fr: 'Analyser les performances de la page LinkedIn et proposer des optimisations.', en: 'Analyze LinkedIn page performance and suggest improvements.' }, deadLineInHours: 72,  createdAt: daysAgo(80) },
    { title: { fr: 'Stratégie de contenu TikTok',           en: 'TikTok content strategy'             }, description: { fr: 'Élaborer une stratégie de contenu TikTok pour atteindre 10K abonnés.', en: 'Develop a TikTok content strategy to reach 10K followers.' }, deadLineInHours: 96,  createdAt: daysAgo(75) },
    // SEO tasks
    { title: { fr: 'Audit SEO du site web',                 en: 'Website SEO audit'                   }, description: { fr: 'Analyser les performances SEO et identifier les 20 mots-clés prioritaires.', en: 'Analyze SEO performance and identify top 20 priority keywords.' }, deadLineInHours: 72,  createdAt: daysAgo(88) },
    { title: { fr: 'Rédiger 3 articles de blog SEO',        en: 'Write 3 SEO blog articles'           }, description: { fr: 'Articles de 1500 mots optimisés pour les requêtes identifiées.', en: '1500-word articles optimized for target keywords.' }, deadLineInHours: 120, createdAt: daysAgo(70) },
    { title: { fr: 'Backlink outreach — 10 contacts',       en: 'Backlink outreach — 10 contacts'     }, description: { fr: 'Identifier et contacter 10 sites partenaires pour des échanges de liens.', en: 'Identify and contact 10 partner sites for link exchanges.' }, deadLineInHours: 96,  createdAt: daysAgo(60) },
    // Content tasks
    { title: { fr: 'Produire 2 vidéos YouTube',             en: 'Produce 2 YouTube videos'            }, description: { fr: 'Scripting, tournage et montage de 2 vidéos de 8-10 minutes.', en: 'Scripting, filming and editing 2 videos of 8-10 minutes.' }, deadLineInHours: 168, createdAt: daysAgo(82) },
    { title: { fr: 'Créer une infographie mensuelle',       en: 'Create monthly infographic'          }, description: { fr: 'Infographie visuelle résumant les KPIs marketing du mois.', en: 'Visual infographic summarizing monthly marketing KPIs.' }, deadLineInHours: 36,  createdAt: daysAgo(65) },
    { title: { fr: 'Rédiger une newsletter hebdomadaire',   en: 'Write weekly newsletter'             }, description: { fr: 'Newsletter de 500 mots envoyée à 2000 abonnés chaque vendredi.', en: '500-word newsletter sent to 2000 subscribers every Friday.' }, deadLineInHours: 12,  createdAt: daysAgo(55) },
    // Email tasks
    { title: { fr: 'Séquence email de bienvenue (5 emails)','en': 'Welcome email sequence (5 emails)' }, description: { fr: 'Configurer et rédiger une séquence automatisée de 5 emails de bienvenue.', en: 'Set up and write an automated welcome email sequence of 5 emails.' }, deadLineInHours: 96,  createdAt: daysAgo(78) },
    { title: { fr: 'Campagne emailing Black Friday',        en: 'Black Friday email campaign'         }, description: { fr: 'Concevoir et planifier la campagne emailing Black Friday : 3 emails sur 7 jours.', en: 'Design and plan Black Friday email campaign: 3 emails over 7 days.' }, deadLineInHours: 120, createdAt: daysAgo(50) },
    { title: { fr: 'Nettoyer la base de données email',     en: 'Clean email database'                }, description: { fr: 'Supprimer les contacts inactifs (+12 mois), valider les emails bounced.', en: 'Remove inactive contacts (12+ months), validate bounced emails.' }, deadLineInHours: 48,  createdAt: daysAgo(42) },
    // Analytics tasks
    { title: { fr: 'Rapport mensuel de performance',        en: 'Monthly performance report'          }, description: { fr: 'Compiler les KPIs de tous les canaux dans un tableau de bord mensuel.', en: 'Compile KPIs from all channels into a monthly dashboard.' }, deadLineInHours: 48,  createdAt: daysAgo(93) },
    { title: { fr: 'Configurer Google Analytics 4',         en: 'Set up Google Analytics 4'           }, description: { fr: 'Migrer GA3 vers GA4 : événements, conversions, audiences.', en: 'Migrate GA3 to GA4: events, conversions, audiences.' }, deadLineInHours: 72,  createdAt: daysAgo(72) },
    { title: { fr: 'Analyser les métriques réseaux sociaux',en: 'Analyze social media metrics'        }, description: { fr: 'Rapport mensuel des performances Instagram, LinkedIn, Facebook et TikTok.', en: 'Monthly report for Instagram, LinkedIn, Facebook and TikTok performance.' }, deadLineInHours: 36,  createdAt: daysAgo(58) },
    // Google Ads tasks
    { title: { fr: 'Lancer une campagne Google Search',     en: 'Launch Google Search campaign'       }, description: { fr: 'Créer et optimiser une campagne de notoriété sur Google Search avec budget 500€/mois.', en: 'Create and optimize a brand awareness campaign on Google Search, 500€/month budget.' }, deadLineInHours: 48,  createdAt: daysAgo(68) },
    { title: { fr: 'Optimiser le Quality Score des annonces','en': 'Improve ads Quality Score'        }, description: { fr: 'Revoir les annonces avec QS < 6 et proposer des améliorations textuelles.', en: 'Review ads with QS < 6 and suggest copy improvements.' }, deadLineInHours: 36,  createdAt: daysAgo(44) },
    // Growth tasks
    { title: { fr: 'Configurer une campagne Google Ads',    en: 'Set up Google Ads campaign'          }, description: { fr: 'Créer et lancer une campagne de retargeting e-commerce sur Google Ads.', en: 'Create and launch an e-commerce retargeting campaign on Google Ads.' }, deadLineInHours: 24,  createdAt: daysAgo(35) },
    { title: { fr: 'Expérience A/B sur landing page',       en: 'A/B test on landing page'            }, description: { fr: 'Définir et lancer un test A/B sur le hero de la landing page principale.', en: 'Define and run an A/B test on the main landing page hero section.' }, deadLineInHours: 120, createdAt: daysAgo(28) },
  ]);
  console.log(`✅ ${tasks.length} tâches créées`);

  // ── Task Responses (assigned to interns & hired) ──────────────
  // status: 0=Open  1=InProgress  2=Review  3=Closed
  const taskRespData = [
    // Sarah (intern 0) — Social Media tasks
    { task: tasks[0]._id,  owner: candidates[0]._id, status: 3, createdAt: daysAgo(88) },  // Closed
    { task: tasks[1]._id,  owner: candidates[0]._id, status: 3, createdAt: daysAgo(82) },  // Closed
    { task: tasks[2]._id,  owner: candidates[0]._id, status: 1, createdAt: daysAgo(78) },  // InProgress
    // Mohamed (intern 1) — SEO tasks
    { task: tasks[4]._id,  owner: candidates[1]._id, status: 3, createdAt: daysAgo(85) },  // Closed
    { task: tasks[5]._id,  owner: candidates[1]._id, status: 2, createdAt: daysAgo(68) },  // Review
    { task: tasks[6]._id,  owner: candidates[1]._id, status: 1, createdAt: daysAgo(58) },  // InProgress
    // Leila (intern 2) — Content tasks
    { task: tasks[7]._id,  owner: candidates[2]._id, status: 3, createdAt: daysAgo(80) },  // Closed
    { task: tasks[8]._id,  owner: candidates[2]._id, status: 1, createdAt: daysAgo(63) },  // InProgress
    { task: tasks[9]._id,  owner: candidates[2]._id, status: 0, createdAt: daysAgo(53) },  // Open
    // Thomas (intern 3) — Email tasks
    { task: tasks[10]._id, owner: candidates[3]._id, status: 3, createdAt: daysAgo(75) },  // Closed
    { task: tasks[11]._id, owner: candidates[3]._id, status: 2, createdAt: daysAgo(48) },  // Review
    { task: tasks[12]._id, owner: candidates[3]._id, status: 1, createdAt: daysAgo(40) },  // InProgress
    // Fatima (intern 4) — Social Media tasks
    { task: tasks[0]._id,  owner: candidates[4]._id, status: 3, createdAt: daysAgo(100) }, // Closed
    { task: tasks[3]._id,  owner: candidates[4]._id, status: 1, createdAt: daysAgo(72) },  // InProgress
    // Lucas (intern 5) — Analytics tasks
    { task: tasks[13]._id, owner: candidates[5]._id, status: 3, createdAt: daysAgo(90) },  // Closed
    { task: tasks[14]._id, owner: candidates[5]._id, status: 2, createdAt: daysAgo(70) },  // Review
    { task: tasks[15]._id, owner: candidates[5]._id, status: 0, createdAt: daysAgo(55) },  // Open
    // Yasmine (intern 6) — SEO tasks
    { task: tasks[4]._id,  owner: candidates[6]._id, status: 3, createdAt: daysAgo(92) },  // Closed
    { task: tasks[6]._id,  owner: candidates[6]._id, status: 1, createdAt: daysAgo(57) },  // InProgress
    // Antoine (intern 7) — Content tasks
    { task: tasks[7]._id,  owner: candidates[7]._id, status: 2, createdAt: daysAgo(85) },  // Review
    { task: tasks[9]._id,  owner: candidates[7]._id, status: 1, createdAt: daysAgo(52) },  // InProgress
    // Amira (hired 8) — Email tasks
    { task: tasks[10]._id, owner: candidates[8]._id, status: 3, createdAt: daysAgo(80) },  // Closed
    { task: tasks[12]._id, owner: candidates[8]._id, status: 0, createdAt: daysAgo(38) },  // Open
    // Mathieu (hired 9) — Social Media + Analytics
    { task: tasks[1]._id,  owner: candidates[9]._id, status: 3, createdAt: daysAgo(75) },  // Closed
    { task: tasks[15]._id, owner: candidates[9]._id, status: 1, createdAt: daysAgo(54) },  // InProgress
    // Rania (hired 10) — Analytics + Growth
    { task: tasks[13]._id, owner: candidates[10]._id, status: 3, createdAt: daysAgo(68) }, // Closed
    { task: tasks[19]._id, owner: candidates[10]._id, status: 2, createdAt: daysAgo(25) }, // Review
    // Kevin (hired 11) — Content
    { task: tasks[8]._id,  owner: candidates[11]._id, status: 3, createdAt: daysAgo(62) }, // Closed
    // Houda (hired 12) — SEO + Google Ads
    { task: tasks[5]._id,  owner: candidates[12]._id, status: 1, createdAt: daysAgo(56) }, // InProgress
    { task: tasks[16]._id, owner: candidates[12]._id, status: 0, createdAt: daysAgo(40) }, // Open
  ];

  await TaskResponse.insertMany(taskRespData);
  console.log(`✅ ${taskRespData.length} réponses de tâches créées`);

  // ── Admin user ────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin2025!', 10);
  await User.create({
    login: 'admin',
    email: 'admin@shape.fr',
    password: adminPassword,
    roles: ['ADMIN'],
    verifiedAccount: true,
    deleted: false,
  });
  console.log('✅ Admin créé : admin@shape.fr / Admin2025!');

  // ── Summary ───────────────────────────────────────────────────
  console.log('\n🎉 Seed riche terminé avec succès !');
  console.log('─────────────────────────────────────────');
  console.log('📊 Données Power BI :');
  console.log(`   • Candidatures : ${appData.length} (Applied:3  Rejected:8  Interview:4  Hired:5  Intern:8)`);
  console.log(`   • Entretiens   : ${interviewData.length} (completed:13  scheduled:4  cancelled:2)`);
  console.log(`   • Tâches       : ${tasks.length}  |  Réponses : ${taskRespData.length}`);
  console.log(`   • Inscriptions : ${inscriptionData.length}  |  Programmes : ${programsData.length}`);
  console.log(`   • Candidats    : ${candidateRaw.length} (FR:9  DZ:7  MA:3  TN:4  BE:2  CA:1)`);
  console.log('─────────────────────────────────────────');
  console.log('🔑 Login admin    : admin@shape.fr / Admin2025!');
  console.log('🔑 Login company  : rh@mediaspark.fr / Shape2025!');
  console.log('🔑 Login candidat : sarah.dubois@example.com / Shape2025!');
  await mongoose.disconnect();
}

seed().catch(err => { console.error('❌ Seed error:', err); process.exit(1); });
