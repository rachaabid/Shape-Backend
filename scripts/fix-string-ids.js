// fix-string-ids.js — Convertit les _id stockés comme strings en vrais ObjectId BSON.
// Problème : mongoimport depuis un JSON sans $oid stocke "_id": "abc123..." comme string.
// Mongoose populate() caste toujours les champs ref en ObjectId avant de requêter →
// string _id != ObjectId query → aucune jointure ne fonctionne → tout affiche "-".
// Ce script delete + reinsert chaque document avec _id: ObjectId(...).

const targetDb = db.getSiblingDB('shape_db');

const COLLECTIONS = [
  'users', 'skills', 'careers', 'joboffermodels', 'trainings', 'quizzes',
  'textblocs', 'videoyoutubes', 'joboffers', 'jobofferapplications',
  'interviews', 'tasks', 'inscriptions', 'conversations', 'messages',
  'notifications', 'notificationsettings', 'mentorevaluations',
  'trainingrequests', 'companytrainingproposals', 'documentations',
];

const OID_REGEX = /^[0-9a-f]{24}$/i;

print('🔧 Conversion des _id string → ObjectId BSON...');
let totalConverted = 0;

for (const colName of COLLECTIONS) {
  const col = targetDb.getCollection(colName);
  const stringIdDocs = col.find({ _id: { $type: 'string' } }).toArray();
  let count = 0;

  for (const doc of stringIdDocs) {
    if (!OID_REGEX.test(doc._id)) continue;
    const newDoc = Object.assign({}, doc, { _id: new ObjectId(doc._id) });
    try {
      col.insertOne(newDoc);
      col.deleteOne({ _id: doc._id });
      count++;
    } catch (e) {
      print(`  ⚠️  ${colName} ${doc._id}: ${e.message}`);
    }
  }

  if (count > 0) {
    print(`  ✅ ${colName}: ${count} _id convertis`);
    totalConverted += count;
  }
}

print(`🎉 ${totalConverted} _id convertis en ObjectId`);
