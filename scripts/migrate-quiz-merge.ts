/**
 * Migration : fusion Quiz + QuizResponse.
 * Déplace les documents de `quizresponses` dans `quizzes.responses[]`
 * (en conservant les _id), puis supprime l'ancienne collection.
 *
 * ⚠️  À exécuter UNE SEULE FOIS, backend ARRÊTÉ, base sauvegardée.
 * Exécution : npx ts-node scripts/migrate-quiz-merge.ts
 */
import mongoose from 'mongoose';
import dotenv   from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI!);
  const db = mongoose.connection.db!;
  console.log('✅ Connecté à', db.databaseName);

  const names = (await db.listCollections().toArray()).map(c => c.name);
  if (!names.includes('quizresponses')) {
    console.log('• Aucune collection quizresponses — rien à migrer.');
    await mongoose.disconnect();
    return;
  }

  const responses = await db.collection('quizresponses').find({}).toArray();
  let pushed = 0, orphan = 0;
  for (const qr of responses) {
    const resp = {
      _id:         qr['_id'],
      owner:       qr['owner'],
      inscription: qr['inscription'],
      reponses:    qr['reponses'] || [],
      deleted:     qr['deleted'] || false,
      createdAt:   qr['createdAt'],
    };
    const r = await db.collection('quizzes').updateOne(
      { _id: qr['quiz'] },
      { $push: { responses: resp as any } },
    );
    if (r.matchedCount) pushed++; else orphan++;
  }
  console.log(`✓ ${pushed} réponses migrées vers quizzes.responses`);
  if (orphan) console.log(`⚠ ${orphan} réponses orphelines (quiz introuvable) ignorées`);

  await db.collection('quizresponses').drop().catch(() => {});
  console.log('🗑️  Collection quizresponses supprimée');

  await mongoose.disconnect();
  console.log('=== ✅ Migration Quiz terminée ===');
}

run().catch(async (e) => { console.error('❌', e); await mongoose.disconnect().catch(() => {}); process.exit(1); });
