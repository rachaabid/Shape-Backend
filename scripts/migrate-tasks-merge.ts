/**
 * Migration : fusion Task + TaskResponse + TaskResponseComment.
 * Déplace les documents des collections `taskresponses` et `taskresponsecomments`
 * dans `tasks.responses[]` (et `responses[].comments[]`), en conservant les _id
 * existants, puis supprime les anciennes collections.
 *
 * ⚠️  À exécuter UNE SEULE FOIS, backend ARRÊTÉ, base sauvegardée.
 * Exécution : npx ts-node scripts/migrate-tasks-merge.ts
 */
import mongoose from 'mongoose';
import dotenv   from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI!);
  const db = mongoose.connection.db!;
  console.log('✅ Connecté à', db.databaseName);

  const names = (await db.listCollections().toArray()).map(c => c.name);
  if (!names.includes('taskresponses')) {
    console.log('• Aucune collection taskresponses — rien à migrer.');
    await mongoose.disconnect();
    return;
  }

  const responses = await db.collection('taskresponses').find({}).toArray();
  const comments  = names.includes('taskresponsecomments')
    ? await db.collection('taskresponsecomments').find({}).toArray()
    : [];

  // Regrouper les commentaires par réponse
  const byResp = new Map<string, any[]>();
  for (const c of comments) {
    const k = String(c['taskResponse']);
    if (!byResp.has(k)) byResp.set(k, []);
    byResp.get(k)!.push({
      _id: c['_id'], owner: c['owner'], user: c['user'],
      message: c['message'], deleted: c['deleted'] || false, createdAt: c['createdAt'],
    });
  }

  let pushed = 0, orphan = 0;
  for (const tr of responses) {
    const resp = {
      _id:         tr['_id'],
      owner:       tr['owner'],
      inscription: tr['inscription'],
      status:      tr['status'] ?? 0,
      files:       tr['files'] || [],
      comments:    byResp.get(String(tr['_id'])) || [],
      deleted:     tr['deleted'] || false,
      createdAt:   tr['createdAt'],
    };
    const r = await db.collection('tasks').updateOne(
      { _id: tr['task'] },
      { $push: { responses: resp as any } },
    );
    if (r.matchedCount) pushed++; else orphan++;
  }
  console.log(`✓ ${pushed} réponses migrées vers tasks.responses (${comments.length} commentaires imbriqués)`);
  if (orphan) console.log(`⚠ ${orphan} réponses orphelines (tâche introuvable) ignorées`);

  await db.collection('taskresponses').drop().catch(() => {});
  if (names.includes('taskresponsecomments')) await db.collection('taskresponsecomments').drop().catch(() => {});
  console.log('🗑️  Collections taskresponses / taskresponsecomments supprimées');

  await mongoose.disconnect();
  console.log('=== ✅ Migration Task terminée ===');
}

run().catch(async (e) => { console.error('❌', e); await mongoose.disconnect().catch(() => {}); process.exit(1); });
