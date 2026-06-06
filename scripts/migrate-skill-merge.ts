/**
 * Migration : fusion HardSkill + SoftwareSkill + FocusedSkill + SoftSkill → Skill.
 * Copie les 4 collections dans `skills` en ajoutant le champ `type`
 * (en conservant les _id, donc les références User/JobOffer restent valides),
 * puis supprime les anciennes collections.
 *
 * ⚠️  À exécuter UNE SEULE FOIS, backend ARRÊTÉ, base sauvegardée.
 * Exécution : npx ts-node scripts/migrate-skill-merge.ts
 */
import mongoose from 'mongoose';
import dotenv   from 'dotenv';
dotenv.config();

const MAP: { coll: string; type: string }[] = [
  { coll: 'hardskills',     type: 'HARD' },
  { coll: 'softwareskills', type: 'SOFTWARE' },
  { coll: 'focusedskills',  type: 'FOCUSED' },
  { coll: 'softskills',     type: 'SOFT' },
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI!);
  const db = mongoose.connection.db!;
  console.log('✅ Connecté à', db.databaseName);

  const names = (await db.listCollections().toArray()).map(c => c.name);

  for (const { coll, type } of MAP) {
    if (!names.includes(coll)) { console.log(`• ${coll} absente, ignorée`); continue; }
    const docs = await db.collection(coll).find({}).toArray();
    if (docs.length) {
      const withType = docs.map(d => ({ ...d, type }));   // garde le même _id
      // insertMany en ignorant les doublons éventuels (réexécution)
      await db.collection('skills').insertMany(withType, { ordered: false }).catch(() => {});
    }
    await db.collection(coll).drop().catch(() => {});
    console.log(`✓ ${coll} → skills (type ${type}) : ${docs.length} documents`);
  }

  await mongoose.disconnect();
  console.log('=== ✅ Migration Skill terminée ===');
}

run().catch(async (e) => { console.error('❌', e); await mongoose.disconnect().catch(() => {}); process.exit(1); });
