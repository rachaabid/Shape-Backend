// fix-dates.js — exécuté par mongosh après mongoimport
// Convertit les champs date stockés comme strings en vrais BSON Date
const db = db.getSiblingDB('shape_db');

const DATE_FIELDS_MAP = {
  users:                    ['createdAt', 'updatedAt', 'deletedAt'],
  jobOfferApplications:     ['createdAt', 'updatedAt', 'deletedAt'],
  interviews:               ['createdAt', 'updatedAt', 'scheduledAt'],
  inscriptions:             ['createdAt', 'updatedAt', 'deletedAt'],
  jobOffers:                ['createdAt', 'updatedAt', 'deletedAt'],
  tasks:                    ['createdAt', 'updatedAt', 'deletedAt'],
  messages:                 ['createdAt', 'updatedAt'],
  notifications:            ['createdAt', 'updatedAt'],
  conversations:            ['createdAt', 'updatedAt'],
  mentorEvaluations:        ['createdAt', 'updatedAt'],
  trainingRequests:         ['createdAt', 'updatedAt'],
  companyTrainingProposals: ['createdAt', 'updatedAt'],
  documentations:           ['createdAt', 'updatedAt'],
  trainings:                ['createdAt', 'updatedAt'],
  quizzes:                  ['createdAt', 'updatedAt'],
  skills:                   ['createdAt', 'updatedAt'],
  careers:                  ['createdAt', 'updatedAt'],
  jobOfferModels:           ['createdAt', 'updatedAt'],
  textBlocs:                ['createdAt', 'updatedAt'],
  videos:                   ['createdAt', 'updatedAt'],
  notificationSettings:     ['createdAt', 'updatedAt'],
};

print('🔧 Conversion des dates string → BSON Date...');
let totalFixed = 0;

Object.entries(DATE_FIELDS_MAP).forEach(([colName, fields]) => {
  fields.forEach(field => {
    const result = db[colName].updateMany(
      { [field]: { $type: 'string' } },
      [{ $set: { [field]: { $toDate: `$${field}` } } }]
    );
    if (result.modifiedCount > 0) {
      print(`  ✅ ${colName}.${field}: ${result.modifiedCount} docs`);
      totalFixed += result.modifiedCount;
    }
  });
});

print(`🎉 ${totalFixed} valeurs converties en BSON Date`);
