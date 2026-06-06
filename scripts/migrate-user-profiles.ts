/**
 * Migration : User à plat + Company séparée  →  User à profils imbriqués.
 *
 *  1. Déplace les champs candidat à plat dans `candidateProfile`.
 *  2. Absorbe chaque document `companies` dans le `companyProfile` de son owner,
 *     puis repointe JobOffer.company / Interview.companyId /
 *     CompanyTrainingProposal.company depuis l'ancien Company._id vers owner (User._id).
 *  3. Supprime la collection `companies`.
 *
 * ⚠️  À exécuter UNE SEULE FOIS, backend ARRÊTÉ, base sauvegardée.
 * Exécution : npx ts-node scripts/migrate-user-profiles.ts
 */
import mongoose from 'mongoose';
import dotenv   from 'dotenv';
dotenv.config();

const CAND = ['cvStorage', 'hardSkills', 'softwares', 'softSkills', 'focusedSkills',
  'languages', 'workingMode', 'trainings', 'portfolioLinks',
  'professionalExperiences', 'academicTrainings'];

async function run() {
  await mongoose.connect(process.env.MONGO_URI!);
  const db = mongoose.connection.db!;
  console.log('✅ Connecté à', db.databaseName);

  // ── 1. Champs candidat à plat → candidateProfile ────────────────────
  const candSet: Record<string, string> = {};
  CAND.forEach(f => { candSet[`candidateProfile.${f}`] = `$${f}`; });
  const res1 = await db.collection('users').updateMany(
    { $or: CAND.map(f => ({ [f]: { $exists: true } })) },
    [
      { $set: candSet },
      { $unset: CAND },
    ],
  );
  console.log(`✓ candidateProfile : ${res1.modifiedCount} utilisateurs migrés`);

  // ── 2. companies → companyProfile + repointage des refs ─────────────
  const names = (await db.listCollections().toArray()).map(c => c.name);
  if (names.includes('companies')) {
    const companies = await db.collection('companies').find({}).toArray();
    let moved = 0, repointed = 0;
    for (const c of companies) {
      const ownerId = c['owner'];
      if (!ownerId) continue;
      await db.collection('users').updateOne(
        { _id: ownerId },
        { $set: { companyProfile: { companyName: c['name'], address: c['address'], logo: c['logo'] } } },
      );
      moved++;
      for (const [coll, field] of [['joboffers', 'company'], ['interviews', 'companyId'], ['companytrainingproposals', 'company']] as const) {
        const r = await db.collection(coll).updateMany({ [field]: c['_id'] }, { $set: { [field]: ownerId } });
        repointed += r.modifiedCount;
      }
    }
    await db.collection('companies').drop().catch(() => {});
    console.log(`✓ companyProfile : ${moved} entreprises absorbées, ${repointed} références repointées, collection 'companies' supprimée`);
  } else {
    console.log('• collection companies absente, ignorée');
  }

  await mongoose.disconnect();
  console.log('=== ✅ Migration User/Company terminée ===');
}

run().catch(async (e) => { console.error('❌', e); await mongoose.disconnect().catch(() => {}); process.exit(1); });
