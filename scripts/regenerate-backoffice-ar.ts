/**
 * Regenere src/app/i18n/ar.ts a partir de fr.ts via MyMemory translate API.
 *
 * Strategie : on lit fr.ts (deja propre apres la passe mojibake), on extrait
 * chaque paire KEY: 'valeur', on appelle l'API pour fr->ar, puis on ecrit
 * un nouveau ar.ts au meme format.
 *
 * Les placeholders {{var}} sont preserves tel quel (echappes avant l'appel,
 * restaures apres). Les valeurs courtes (<2 char) ne sont pas traduites.
 *
 * Usage : cd shape-backoffice && npx ts-node scripts/regenerate-ar.ts
 */
import fs    from 'fs';
import path  from 'path';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const BACKOFFICE = path.resolve(__dirname, '../../shape-backoffice');
const FR_PATH    = path.join(BACKOFFICE, 'src/app/i18n/fr.ts');
const AR_PATH    = path.join(BACKOFFICE, 'src/app/i18n/ar.ts');

// ── Rate-limit helpers (alignes sur Shape-Backend/scripts/translate-all.ts) ─
let reqCount = 0;
const sleep  = (ms: number) => new Promise(r => setTimeout(r, ms));

async function translate(text: string, attempt = 1): Promise<string> {
  const trimmed = text?.trim();
  if (!trimmed || trimmed.length < 2) return text ?? '';

  // Protege les placeholders {{x}} et les balises Angular {{ x | y }} pendant
  // la traduction (sinon MyMemory les casse).
  const placeholders: string[] = [];
  const masked = trimmed.replace(/\{\{[^}]+\}\}/g, m => {
    placeholders.push(m);
    return `__P${placeholders.length - 1}__`;
  });

  reqCount++;
  if (reqCount % 3 === 0) await sleep(1200);

  const email = process.env.MYMEMORY_EMAIL ? `&de=${encodeURIComponent(process.env.MYMEMORY_EMAIL)}` : '';
  const url   = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(masked)}&langpair=fr|ar${email}`;

  try {
    const res    = await axios.get(url, { timeout: 15_000 });
    const status = res.data?.responseStatus;
    let result   = res.data?.responseData?.translatedText as string | undefined;

    if (status === 200 && result && !result.includes('MYMEMORY WARNING')) {
      result = result.replace(/__P(\d+)__/g, (_, i) => placeholders[+i] ?? '');
      return result;
    }
    if (status === 429 || result?.includes('MYMEMORY WARNING')) {
      console.warn('\n⚠️  Quota MyMemory atteint.');
      process.exit(1);
    }
  } catch (err: any) {
    if (err?.response?.status === 429 && attempt <= 3) {
      const w = attempt * 30;
      console.warn(`  ⏳ 429 — attente ${w}s (${attempt}/3)`);
      await sleep(w * 1000);
      return translate(text, attempt + 1);
    }
    console.warn(`  ⚠️  Erreur: ${err.message}`);
  }
  return text;
}

// Lecture / parsing de fr.ts (objet TS -> objet JS).
function loadFrDict(): Record<string, string> {
  const src = fs.readFileSync(FR_PATH, 'utf8');
  // Extrait le corps { ... } apres le `= ` et avant le `;` final.
  const m = src.match(/=\s*(\{[\s\S]*?\})\s*;?\s*$/m);
  if (!m) throw new Error('Impossible de parser fr.ts');
  // Le corps est du JS valide modulo les commentaires de ligne -> on `eval`.
  // ATTENTION : usage controle, source de confiance (notre propre repo).
  const obj = (0, eval)('(' + m[1] + ')');
  if (typeof obj !== 'object' || !obj) throw new Error('fr.ts ne contient pas un objet');
  return obj as Record<string, string>;
}

// Echappement pour string literal JS (single quotes -> double si necessaire).
function fmtValue(v: string): string {
  if (!v.includes("'") && !v.includes('\\')) return `'${v}'`;
  if (!v.includes('"'))                       return `"${v}"`;
  return JSON.stringify(v);
}

async function main() {
  const fr = loadFrDict();
  const keys = Object.keys(fr);
  console.log(`📚 ${keys.length} cles a traduire fr -> ar`);

  const ar: Record<string, string> = {};
  let done = 0;
  for (const k of keys) {
    const v   = fr[k];
    const out = await translate(v);
    ar[k]     = out;
    done++;
    if (done % 25 === 0 || done === keys.length) {
      process.stdout.write(`\r  ↳ ${done}/${keys.length}`);
    }
  }
  process.stdout.write('\n');

  // Ecriture de ar.ts au meme format que fr.ts.
  let out = '/**\n * Dictionnaire arabe (ar) du backoffice.\n * Genere automatiquement depuis fr.ts via MyMemory.\n */\nexport const ar: Record<string, string> = {\n';
  for (const k of keys) out += `    ${k}: ${fmtValue(ar[k])},\n`;
  out += '};\n';
  fs.writeFileSync(AR_PATH, out, 'utf8');
  console.log(`✅ ${AR_PATH} regenere (${keys.length} cles)`);
}

main().catch(e => { console.error(e); process.exit(1); });