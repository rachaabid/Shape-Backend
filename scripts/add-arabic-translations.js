/**
 * Traductions arabes complètes pour formations et compétences.
 * Utilisation : mongosh "mongodb://localhost:27017/shape_db" scripts/add-arabic-translations.js
 */

const db = db.getSiblingDB('shape_db');

// ── Formations ────────────────────────────────────────────────────────────────
print('📚 Traduction des formations en arabe...');

const trainingTitles = {
  'AWS Cloud Computing':                'الحوسبة السحابية AWS',
  'Advanced React & TypeScript':        'React و TypeScript المتقدم',
  'Data Science with Python':           'علم البيانات مع Python',
  'DevOps with Docker & Kubernetes':    'DevOps مع Docker و Kubernetes',
  'Digital Marketing & SEO':            'التسويق الرقمي وتحسين محركات البحث',
  'Full-Stack Web Development':         'تطوير الويب الشامل',
  'Java & Spring Boot':                 'Java و Spring Boot',
  'Mobile Development with Flutter':   'تطوير تطبيقات الجوال مع Flutter',
  'Offensive Cybersecurity':            'الأمن السيبراني الهجومي',
  'UX/UI Design with Figma':           'تصميم UX/UI مع Figma',
};

let trainingCount = 0;
db.trainings.find({}).forEach(doc => {
  const enTitle = doc.title && doc.title.en ? doc.title.en : '';
  // Extraire le nom de base et le numéro de session : "AWS Cloud Computing — Session 3"
  const match = enTitle.match(/^(.+?)\s*—\s*Session\s*(\d+)$/);
  if (!match) return;
  const baseName = match[1].trim();
  const sessionNum = match[2];
  const arBase = trainingTitles[baseName];
  if (!arBase) return;
  const arTitle = `${arBase} — الدورة ${sessionNum}`;
  db.trainings.updateOne({ _id: doc._id }, { $set: { 'title.ar': arTitle } });
  trainingCount++;
});
print(`  ✅ ${trainingCount} formations traduites`);

// ── Compétences ───────────────────────────────────────────────────────────────
print('🛠  Traduction des compétences en arabe...');

// Compétences techniques : noms internationaux, pas de traduction nécessaire
// Compétences translatables (soft skills + quelques tech)
const skillTranslations = {
  // Tech - termes traduisibles
  'Machine Learning':             'التعلم الآلي',
  'Deep Learning':                'التعلم العميق',
  'Data Analyse':                 'تحليل البيانات',
  'Big Data':                     'البيانات الضخمة',
  'Cybersécurité':                'الأمن السيبراني',
  'SEO / Référencement':          'تحسين محركات البحث SEO',
  'Social Media Marketing':       'التسويق عبر وسائل التواصل الاجتماعي',
  'Marketing de contenu':         'تسويق المحتوى',
  'Email Marketing':              'التسويق عبر البريد الإلكتروني',
  'Community Management':         'إدارة المجتمع الرقمي',
  'Growth Hacking':               'اختراق النمو التسويقي',
  'UX / UI Design':               'تصميم تجربة المستخدم',
  'Motion Design':                'تصميم الحركة',
  'Copywriting':                  'كتابة المحتوى الإقناعي',
  'E-commerce':                   'التجارة الإلكترونية',
  'Microservices':                'الخدمات المصغرة',
  // Soft skills
  'Gestion du stress':            'إدارة الضغط',
  'Polyvalence':                  'تعدد المهارات',
  'Prise d\'initiative':          'روح المبادرة',
  'Sens de l\'organisation':      'الحس التنظيمي',
  'Capacité d\'adaptation':       'القدرة على التكيف',
  'Résistance à la pression':     'الصمود تحت الضغط',
  'Curiosité intellectuelle':     'الفضول الفكري',
  'Persévérance':                 'المثابرة',
  'Sens du détail':               'الاهتمام بالتفاصيل',
  'Esprit d\'équipe':             'روح الفريق',
  'Gestion du temps':             'إدارة الوقت',
  'Autonomie':                    'الاستقلالية',
  'Communication':                'التواصل',
  'Travail en équipe':            'العمل الجماعي',
  'Résolution de problèmes':      'حل المشكلات',
  'Rigueur':                      'الدقة والصرامة',
  'Adaptabilité':                 'القدرة على التكيف',
  'Esprit d\'analyse':            'الروح التحليلية',
  'Curiosité':                    'الفضول',
  'Leadership':                   'القيادة',
  'Créativité':                   'الإبداع',
  'Esprit critique':              'التفكير النقدي',
  'Empathie':                     'التعاطف',
  'Diplomatie':                   'الدبلوماسية',
  'Sens du service':              'روح الخدمة',
};

let skillCount = 0;
db.skills.find({}).forEach(doc => {
  const keyFr = doc.name && doc.name.fr ? doc.name.fr : '';
  const keyEn = doc.name && doc.name.en ? doc.name.en : '';
  const ar = skillTranslations[keyFr] || skillTranslations[keyEn];
  if (!ar) return;
  db.skills.updateOne({ _id: doc._id }, { $set: { 'name.ar': ar } });
  skillCount++;
});
print(`  ✅ ${skillCount} compétences traduites`);

print('🎉 Traductions arabes appliquées avec succès !');
