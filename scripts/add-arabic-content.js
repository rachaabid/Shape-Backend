/**
 * Ajoute des données arabes dans la base MongoDB pour les formations et compétences.
 * Les noms techniques (TypeScript, React, Python…) sont universels → on copie la valeur anglaise.
 * Les titres de formations → on copie la valeur anglaise (plus lisible qu'une version française
 * pour un arabophone).
 *
 * Utilisation :
 *   docker exec -it shape_mongo mongosh shape_db /docker-entrypoint-initdb.d/add-arabic.js
 *
 * Ou hors Docker :
 *   mongosh "mongodb://localhost:27017/shape_db" scripts/add-arabic-content.js
 */

const DB_NAME = 'shape_db';

const db = db.getSiblingDB(DB_NAME);

// ── Formations ────────────────────────────────────────────────────────────────
print('📚 Ajout title.ar aux formations...');
let trainingCount = 0;
db.trainings.find({ 'title.ar': { $exists: false } }).forEach(doc => {
  const ar = (doc.title && (doc.title.en || doc.title.fr)) || null;
  if (!ar) return;
  db.trainings.updateOne({ _id: doc._id }, { $set: { 'title.ar': ar } });
  trainingCount++;
});
print(`  ✅ ${trainingCount} formations mises à jour`);

// ── Compétences (skills) ──────────────────────────────────────────────────────
print('🛠  Ajout name.ar aux compétences...');
let skillCount = 0;
db.skills.find({ 'name.ar': { $exists: false } }).forEach(doc => {
  const ar = (doc.name && (doc.name.en || doc.name.fr)) || null;
  if (!ar) return;
  db.skills.updateOne({ _id: doc._id }, { $set: { 'name.ar': ar } });
  skillCount++;
});
print(`  ✅ ${skillCount} compétences mises à jour`);

print('🎉 Terminé — données arabes ajoutées.');
