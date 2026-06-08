/**
 * Script de traduction automatique de toutes les données multilingues MongoDB.
 *
 * Pour chaque document, détecte la langue source et traduit vers les 2 autres.
 * - Si { fr: "...", en: "", ar: "" }  → traduit vers EN et AR
 * - Si { fr: "", en: "...", ar: "" }  → traduit vers FR et AR
 * - Si { fr: "", en: "", ar: "..." }  → traduit vers FR et EN
 * - Si "string simple" (ancien format) → détecte la langue et traduit
 *
 * API : MyMemory (gratuite, ~100 req/jour sans email, ~1000 avec email)
 *       Ajoutez MYMEMORY_EMAIL=votre@email.com dans .env pour plus de quota.
 *
 * Usage : npx ts-node scripts/translate-all.ts
 */

import mongoose from 'mongoose';
import dotenv   from 'dotenv';
import axios    from 'axios';
dotenv.config();

// ── Types ─────────────────────────────────────────────────────────────────────
type Lang   = 'fr' | 'en' | 'ar';
const LANGS: Lang[] = ['fr', 'en', 'ar'];

// ── Rate-limit helpers ────────────────────────────────────────────────────────
let   reqCount = 0;
const sleep    = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Detect language from Arabic unicode range ─────────────────────────────────
function detectLang(text: string): Lang {
  if (/[؀-ۿ]/.test(text)) return 'ar';
  // Simple English detection: mostly ASCII letters, no French accents
  if (/^[\x20-\x7E]+$/.test(text) && !/[àâäéèêëîïôùûüç]/i.test(text)) return 'en';
  return 'fr';
}

// ── Split long text into ≤450-char chunks (MyMemory limit) ───────────────────
function splitText(text: string): string[] {
  const MAX = 450;
  if (text.length <= MAX) return [text];

  const chunks: string[] = [];
  let   current          = '';

  // Split by sentence-ending punctuation
  const parts = text.split(/(?<=[.!?؟\n])\s+/);
  for (const part of parts) {
    if ((current + ' ' + part).trim().length > MAX) {
      if (current.trim()) chunks.push(current.trim());
      current = part;
    } else {
      current = (current + ' ' + part).trim();
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length ? chunks : [text.slice(0, MAX)];
}

// ── Call MyMemory API (avec retry sur 429) ────────────────────────────────────
async function callTranslate(text: string, from: Lang, to: Lang, attempt = 1): Promise<string> {
  const trimmed = text?.trim();
  if (!trimmed || trimmed.length < 2) return text ?? '';

  reqCount++;
  // Pause toutes les 3 requêtes pour éviter le rate-limit
  if (reqCount % 3 === 0) await sleep(1200);

  const email = process.env.MYMEMORY_EMAIL ? `&de=${encodeURIComponent(process.env.MYMEMORY_EMAIL)}` : '';
  const url   = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${from}|${to}${email}`;

  try {
    const res    = await axios.get(url, { timeout: 15_000 });
    const status = res.data?.responseStatus;
    const result = res.data?.responseData?.translatedText;

    if (status === 200 && result && !result.includes('MYMEMORY WARNING')) return result;

    // Quota journalier dépassé
    if (status === 429 || result?.includes('MYMEMORY WARNING')) {
      console.warn('\n⚠️  Quota MyMemory atteint pour aujourd\'hui.');
      if (!process.env.MYMEMORY_EMAIL) {
        console.warn('   → Ajoutez MYMEMORY_EMAIL=votre@email.com dans .env et relancez demain.');
      } else {
        console.warn('   → Quota email également atteint. Relancez demain.');
      }
      process.exit(1);
    }
  } catch (err: any) {
    // 429 retourné comme erreur HTTP par axios
    if (err?.response?.status === 429) {
      if (attempt <= 3) {
        const waitSec = attempt * 30;
        console.warn(`  ⏳ Rate-limit 429 — attente ${waitSec}s avant retry (${attempt}/3)…`);
        await sleep(waitSec * 1000);
        return callTranslate(text, from, to, attempt + 1);
      }
      console.warn('\n⚠️  Quota MyMemory dépassé après 3 tentatives.');
      if (!process.env.MYMEMORY_EMAIL) {
        console.warn('   → Ajoutez MYMEMORY_EMAIL=votre@email.com dans .env et relancez.');
      } else {
        console.warn('   → Relancez demain (quota journalier atteint).');
      }
      process.exit(1);
    }
    console.warn(`  ⚠️  Erreur réseau: ${err.message}`);
  }
  return text;
}

// ── Translate a full text (handles chunking for long texts) ───────────────────
async function translate(text: string, from: Lang, to: Lang): Promise<string> {
  const chunks    = splitText(text);
  const results   = [] as string[];
  for (const chunk of chunks) {
    results.push(await callTranslate(chunk, from, to));
  }
  return results.join(' ');
}

// ── Fill missing language slots in a { fr?, en?, ar? } object ────────────────
async function fillMissing(
  obj:   Record<string, string | undefined>,
  label: string,
): Promise<boolean> {
  const present = LANGS.filter(l => obj[l]?.trim());
  const missing  = LANGS.filter(l => !obj[l]?.trim());

  if (!present.length || !missing.length) return false;

  const source  = present[0];
  let   changed = false;

  for (const target of missing) {
    const result = await translate(obj[source]!, source, target);
    if (result && result !== obj[source]) {
      obj[target] = result;
      changed     = true;
      console.log(`    [${label}] ${source} → ${target}: "${result.slice(0, 60).replace(/\n/g, ' ')}…"`);
    }
  }
  return changed;
}

// ── Normalize a Mixed field (string or object) ────────────────────────────────
// Returns the updated multilingual object and whether it changed.
async function normalizeMixedField(
  val:   any,
  label: string,
): Promise<{ result: Record<Lang, string>; changed: boolean }> {
  const empty: Record<Lang, string> = { fr: '', en: '', ar: '' };

  if (!val) return { result: empty, changed: false };

  if (typeof val === 'string') {
    const lang = detectLang(val);
    const obj: Record<Lang, string> = { ...empty, [lang]: val.trim() };
    await fillMissing(obj, label);
    return { result: obj, changed: true };
  }

  // Already an object — fill missing
  const obj: Record<Lang, string> = {
    fr: (val.fr ?? '').trim(),
    en: (val.en ?? '').trim(),
    ar: (val.ar ?? '').trim(),
  };
  const changed = await fillMissing(obj, label);
  return { result: obj, changed };
}

// ── Recursively process nested { fr, en, ar } objects in a document node ─────
async function processNode(node: any, path: string): Promise<boolean> {
  if (!node || typeof node !== 'object') return false;

  let changed = false;

  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      if (await processNode(node[i], `${path}[${i}]`)) changed = true;
    }
    return changed;
  }

  // Check if this object itself is strictly a multilingual { fr?, en?, ar? } leaf
  const keys      = Object.keys(node).filter(k => !['_id', 'id'].includes(k));
  const isMLLeaf  = keys.length > 0 && keys.every(k => LANGS.includes(k as Lang));

  if (isMLLeaf) {
    if (await fillMissing(node, path)) changed = true;
    return changed;
  }

  // Traverse child properties
  const SKIP = new Set(['_id', '__v', 'id', 'createdAt', 'updatedAt', 'responses',
                        'deleted', 'archived', 'files', 'comments', 'reponses', 'owner',
                        'inscription', 'folders', 'documents', 'keyWords']);
  for (const key of Object.keys(node)) {
    if (SKIP.has(key)) continue;
    const val = node[key];
    if (!val || typeof val !== 'object') continue;
    if (await processNode(val, `${path}.${key}`)) changed = true;
  }
  return changed;
}

// ── Stats ─────────────────────────────────────────────────────────────────────
const stats = { total: 0, updated: 0, skipped: 0, errors: 0 };

// ═════════════════════════════════════════════════════════════════════════════
// Per-collection handlers
// ═════════════════════════════════════════════════════════════════════════════

// ── JobOffer : Mixed fields (string or object) ────────────────────────────────
async function processJobOffers(db: mongoose.mongo.Db) {
  const coll   = db.collection('joboffers');
  const docs   = await coll.find({ deleted: { $ne: true } }).toArray();
  const FIELDS = ['title', 'description', 'whoAreThey', 'requiredProfile', 'recruitmentProcess'] as const;

  console.log(`\n📋 JobOffers — ${docs.length} documents`);

  for (const doc of docs) {
    stats.total++;
    let docChanged = false;
    const update: Record<string, any> = {};

    for (const field of FIELDS) {
      const val = doc[field];
      if (!val) continue;

      const { result, changed } = await normalizeMixedField(val, `${field}`);
      if (changed) {
        update[field] = result;
        docChanged    = true;
      }
    }

    if (docChanged) {
      await coll.updateOne({ _id: doc._id }, { $set: update });
      stats.updated++;
      console.log(`  ✅ JobOffer ${doc._id} mis à jour`);
    } else {
      stats.skipped++;
    }
  }
}

// ── CompanyTrainingProposal : Mixed fields ────────────────────────────────────
async function processProposals(db: mongoose.mongo.Db) {
  const coll   = db.collection('companytrainingproposals');
  const docs   = await coll.find({}).toArray();
  const FIELDS = ['title', 'description', 'career', 'targetAudience', 'justification'] as const;

  console.log(`\n📋 CompanyTrainingProposals — ${docs.length} documents`);

  for (const doc of docs) {
    stats.total++;
    let docChanged = false;
    const update: Record<string, any> = {};

    for (const field of FIELDS) {
      const val = doc[field];
      if (!val) continue;

      const { result, changed } = await normalizeMixedField(val, `${field}`);
      if (changed) {
        update[field] = result;
        docChanged    = true;
      }
    }

    if (docChanged) {
      await coll.updateOne({ _id: doc._id }, { $set: update });
      stats.updated++;
      console.log(`  ✅ Proposal ${doc._id} mis à jour`);
    } else {
      stats.skipped++;
    }
  }
}

// ── Training : top-level + nested weeks/lessons/quizzes ──────────────────────
async function processTrainings(db: mongoose.mongo.Db) {
  const coll = db.collection('trainings');
  const docs = await coll.find({ deleted: { $ne: true } }).toArray();

  console.log(`\n📋 Trainings — ${docs.length} documents`);

  for (const doc of docs) {
    stats.total++;

    // Top-level fields
    let docChanged = false;
    const topUpdate: Record<string, any> = {};
    for (const field of ['title', 'description'] as const) {
      const val = doc[field];
      if (!val) continue;
      const obj: Record<Lang, string> = {
        fr: (val.fr ?? '').trim(),
        en: (val.en ?? '').trim(),
        ar: (val.ar ?? '').trim(),
      };
      if (await fillMissing(obj, field)) {
        topUpdate[field] = obj;
        docChanged       = true;
      }
    }

    // Nested weeks → lessons → quizzes (all Mixed or { fr,en,ar })
    const weeks = doc.weeks ?? [];
    if (await processNode(weeks, 'weeks')) docChanged = true;

    if (docChanged) {
      const setObj: Record<string, any> = { ...topUpdate, weeks };
      await coll.updateOne({ _id: doc._id }, { $set: setObj });
      stats.updated++;
      console.log(`  ✅ Training ${doc._id} mis à jour`);
    } else {
      stats.skipped++;
    }
  }
}

// ── Quiz : top-level + sections → questions → options ────────────────────────
async function processQuizzes(db: mongoose.mongo.Db) {
  const coll = db.collection('quizzes');
  const docs = await coll.find({ deleted: { $ne: true } }).toArray();

  console.log(`\n📋 Quizzes — ${docs.length} documents`);

  for (const doc of docs) {
    stats.total++;
    let docChanged = false;

    // Top-level
    for (const field of ['title', 'description'] as const) {
      const val = doc[field];
      if (!val) continue;
      const obj: Record<Lang, string> = {
        fr: (val.fr ?? '').trim(),
        en: (val.en ?? '').trim(),
        ar: (val.ar ?? '').trim(),
      };
      if (await fillMissing(obj, field)) {
        doc[field]  = obj;
        docChanged  = true;
      }
    }

    // Sections
    const sections = doc.sections ?? [];
    if (await processNode(sections, 'sections')) docChanged = true;

    if (docChanged) {
      await coll.updateOne(
        { _id: doc._id },
        { $set: { title: doc.title, description: doc.description, sections } },
      );
      stats.updated++;
      console.log(`  ✅ Quiz ${doc._id} mis à jour`);
    } else {
      stats.skipped++;
    }
  }
}

// ── Task : simple top-level { fr, en, ar } ───────────────────────────────────
async function processTasks(db: mongoose.mongo.Db) {
  const coll = db.collection('tasks');
  const docs = await coll.find({ deleted: { $ne: true } }).toArray();

  console.log(`\n📋 Tasks — ${docs.length} documents`);

  for (const doc of docs) {
    stats.total++;
    let docChanged = false;
    const update: Record<string, any> = {};

    for (const field of ['title', 'description'] as const) {
      const val = doc[field];
      if (!val) continue;
      const obj: Record<Lang, string> = {
        fr: (val.fr ?? '').trim(),
        en: (val.en ?? '').trim(),
        ar: (val.ar ?? '').trim(),
      };
      if (await fillMissing(obj, field)) {
        update[field] = obj;
        docChanged    = true;
      }
    }

    if (docChanged) {
      await coll.updateOne({ _id: doc._id }, { $set: update });
      stats.updated++;
      console.log(`  ✅ Task ${doc._id} mis à jour`);
    } else {
      stats.skipped++;
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Main
// ═════════════════════════════════════════════════════════════════════════════
async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGO_URI manquant dans .env');
    process.exit(1);
  }

  console.log('🔌 Connexion à MongoDB…');
  await mongoose.connect(uri);
  const db = mongoose.connection.db!;
  console.log(`✅ Connecté à "${db.databaseName}"`);

  console.log('\n🌍 Démarrage de la traduction automatique…');
  console.log('   (API MyMemory gratuite — ajoutez MYMEMORY_EMAIL dans .env pour plus de quota)\n');

  await processJobOffers(db);
  await processProposals(db);
  await processTrainings(db);
  await processQuizzes(db);
  await processTasks(db);

  console.log('\n─────────────────────────────────────────');
  console.log(`📊 Résultats :`);
  console.log(`   Total traités   : ${stats.total}`);
  console.log(`   Mis à jour      : ${stats.updated}`);
  console.log(`   Déjà complets   : ${stats.skipped}`);
  console.log(`   Requêtes API    : ${reqCount}`);
  console.log('─────────────────────────────────────────\n');

  await mongoose.disconnect();
  console.log('✅ Terminé.');
}

run().catch(err => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});
