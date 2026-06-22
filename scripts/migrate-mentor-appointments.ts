/**
 * Migration : fusion MentorAppointment → Interview (kind='appointment').
 *
 * L'ancien modèle stockait :
 *   { mentor, intern?, title, subtitle?, date:'YYYY-MM-DD',
 *     startTime:'HH:MM', endTime:'HH:MM', shaperName?, meetingLink?, deleted? }
 *
 * Le nouveau document Interview équivalent :
 *   { kind:'appointment', mentorId, candidateId?, title, subtitle?,
 *     scheduledAt:Date, endAt:Date, meetingLink?, status:'scheduled',
 *     channelName:'', deleted? }
 *
 * ⚠️  À exécuter UNE SEULE FOIS, backend ARRÊTÉ, base sauvegardée.
 * Exécution : npx ts-node scripts/migrate-mentor-appointments.ts
 */
import mongoose from 'mongoose';
import dotenv   from 'dotenv';
dotenv.config();

const SRC_COLL = 'mentorappointments';
const DST_COLL = 'interviews';

async function run() {
  await mongoose.connect(process.env.MONGO_URI!);
  const db = mongoose.connection.db!;
  console.log('Connecté à', db.databaseName);

  const names = (await db.listCollections().toArray()).map(c => c.name);
  if (!names.includes(SRC_COLL)) {
    console.log(`• ${SRC_COLL} absente, rien à migrer.`);
    await mongoose.disconnect();
    return;
  }

  const src = await db.collection(SRC_COLL).find({}).toArray();
  console.log(`• ${src.length} rendez-vous à fusionner`);

  let ok = 0, skipped = 0;
  for (const a of src) {
    const date      = String(a.date      ?? '');
    const startTime = String(a.startTime ?? '');
    const endTime   = String(a.endTime   ?? '');
    if (!date || !startTime || !endTime) { skipped++; continue; }

    const scheduledAt = new Date(`${date}T${startTime}:00`);
    const endAt       = new Date(`${date}T${endTime}:00`);
    if (isNaN(scheduledAt.getTime()) || isNaN(endAt.getTime())) { skipped++; continue; }

    const doc: any = {
      _id:          a._id,           // conserve l'_id pour ne casser aucune référence
      kind:         'appointment',
      mentorId:     a.mentor,
      candidateId:  a.intern || undefined,
      title:        a.title || '',
      subtitle:     a.subtitle || '',
      scheduledAt,
      endAt,
      meetingLink:  a.meetingLink || '',
      channelName:  '',
      status:       'scheduled',
      notes:        '',
      confirmedByCandidate: false,
      confirmedByCompany:   false,
      confirmedByMentor:    false,
      deleted:      a.deleted ?? false,
      createdAt:    a.createdAt ?? new Date(),
      updatedAt:    a.updatedAt ?? new Date(),
    };

    await db.collection(DST_COLL).updateOne(
      { _id: a._id },
      { $set: doc },
      { upsert: true },
    );
    ok++;
  }

  console.log(`✓ Insérés/mis à jour dans ${DST_COLL} : ${ok}`);
  if (skipped) console.log(`! ${skipped} ignorés (date/heure invalides)`);

  await db.collection(SRC_COLL).drop().catch(() => {});
  console.log(`✓ ${SRC_COLL} supprimée`);

  await mongoose.disconnect();
  console.log('Terminé.');
}

run().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});