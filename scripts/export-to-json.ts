/**
 * export-to-json.ts — Exporte le contenu actuel de la base MongoDB
 * vers des fichiers JSON (un par collection).
 *
 * Usage : npm run seed:export-json
 *
 * Sortie : scripts/seed-output/<collection>.json
 *          scripts/seed-output/MANIFEST.json (récapitulatif)
 *
 * Astuce : pour re-injecter ailleurs, utilise mongoimport :
 *   mongoimport --uri mongodb://localhost:27017/shape_db_clone \
 *               --collection users --file scripts/seed-output/users.json --jsonArray
 */
import mongoose from 'mongoose';
import dotenv   from 'dotenv';
import fs       from 'fs/promises';
import path     from 'path';
dotenv.config();

import User                    from '../src/models/User';
import Skill                   from '../src/models/Skill';
import Career                  from '../src/models/Career';
import JobOfferModel           from '../src/models/JobOfferModel';
import Training                from '../src/models/Training';
import Quiz                    from '../src/models/Quiz';
import TextBloc                from '../src/models/TextBloc';
import VideoYoutube            from '../src/models/VideoYoutube';
import JobOffer                from '../src/models/JobOffer';
import Application             from '../src/models/JobOfferApplication';
import Interview               from '../src/models/Interview';
import Task                    from '../src/models/Task';
import Inscription             from '../src/models/Inscription';
import Conversation            from '../src/models/Conversation';
import Message                 from '../src/models/Message';
import Notification            from '../src/models/Notification';
import NotificationSetting     from '../src/models/NotificationSetting';
import MentorEvaluation        from '../src/models/MentorEvaluation';
import TrainingRequest         from '../src/models/TrainingRequest';
import CompanyTrainingProposal from '../src/models/CompanyTrainingProposal';
import Documentation           from '../src/models/Documentation';

const COLLECTIONS: { name: string; model: any }[] = [
  { name: 'users',                     model: User },
  { name: 'skills',                    model: Skill },
  { name: 'careers',                   model: Career },
  { name: 'jobOfferModels',            model: JobOfferModel },
  { name: 'trainings',                 model: Training },
  { name: 'quizzes',                   model: Quiz },
  { name: 'textBlocs',                 model: TextBloc },
  { name: 'videos',                    model: VideoYoutube },
  { name: 'jobOffers',                 model: JobOffer },
  { name: 'jobOfferApplications',      model: Application },
  { name: 'interviews',                model: Interview },
  { name: 'tasks',                     model: Task },
  { name: 'inscriptions',              model: Inscription },
  { name: 'conversations',             model: Conversation },
  { name: 'messages',                  model: Message },
  { name: 'notifications',             model: Notification },
  { name: 'notificationSettings',      model: NotificationSetting },
  { name: 'mentorEvaluations',         model: MentorEvaluation },
  { name: 'trainingRequests',          model: TrainingRequest },
  { name: 'companyTrainingProposals',  model: CompanyTrainingProposal },
  { name: 'documentations',            model: Documentation },
];

async function main() {
  const outDir = path.resolve(__dirname, 'seed-output');
  console.log(`📂 Cible export : ${outDir}`);
  await fs.mkdir(outDir, { recursive: true });

  await mongoose.connect(process.env.MONGO_URI!);
  console.log(`✅ MongoDB connecté`);

  const manifest: Record<string, { count: number; file: string; sizeKB: number }> = {};
  const t0 = Date.now();

  for (const { name, model } of COLLECTIONS) {
    process.stdout.write(`   ↳ ${name.padEnd(28, ' ')}`);
    const docs = await model.find({}).lean();
    const file = path.join(outDir, `${name}.json`);
    const json = JSON.stringify(docs, null, 0); // compact pour réduire la taille
    await fs.writeFile(file, json, 'utf8');
    const stat = await fs.stat(file);
    const sizeKB = Math.round(stat.size / 1024);
    manifest[name] = { count: docs.length, file: `${name}.json`, sizeKB };
    console.log(`${String(docs.length).padStart(7, ' ')} docs · ${String(sizeKB).padStart(6, ' ')} KB`);
  }

  // Manifest récapitulatif
  const manifestFile = path.join(outDir, 'MANIFEST.json');
  await fs.writeFile(
    manifestFile,
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        mongoUri:   process.env.MONGO_URI?.replace(/:\/\/[^@]+@/, '://***@'),
        collections: manifest,
        totals: {
          docs: Object.values(manifest).reduce((s, c) => s + c.count, 0),
          sizeKB: Object.values(manifest).reduce((s, c) => s + c.sizeKB, 0),
        },
      },
      null,
      2,
    ),
    'utf8',
  );

  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n🎉 Export terminé en ${dt}s — manifest : ${manifestFile}`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('\n❌ Erreur:', err);
  process.exit(1);
});