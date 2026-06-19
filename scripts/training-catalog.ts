/**
 * Catalogue de 10 formations RÉELLES avec curriculum complet :
 *   - Plan hebdomadaire cohérent
 *   - Lecons texte (HTML), vidéo YouTube, documentation PDF
 *   - Quiz avec vraies questions / vraies réponses (option correcte score=1)
 *   - TPs (Tasks) avec énoncé, livrables et délai
 *
 * Utilise par scripts/seed-massive.ts pour créer des Training réels.
 */

export interface CatalogLessonText {
  kind: 'text';
  title: { fr: string; en: string };
  htmlContent: string;
  keyWords: string[];
}
export interface CatalogLessonVideo {
  kind: 'video';
  title: { fr: string; en: string };
  videoUrl: string;
  keyWords: string[];
}
export interface CatalogLessonDoc {
  kind: 'doc';
  title: { fr: string; en: string };
  documents: { title: { fr: string }; url: string }[];
  keyWords: string[];
}
export interface CatalogLessonTask {
  kind: 'task';
  title: { fr: string; en: string };
  description: { fr: string; en: string };
  learningOutcome: string;
  deadLineInHours: number;
  keyWords: string[];
}
export interface CatalogLessonQuiz {
  kind: 'quiz';
  title: { fr: string; en: string };
  description?: { fr: string; en: string };
  durationMin: number;        // minutes pour passer le quiz
  deadLineInHours: number;
  keyWords: string[];
  sections: {
    text: { fr: string; en: string };
    questions: {
      text: { fr: string; en: string };
      questionType: 'simple' | 'multiple';
      options: { text: { fr: string; en: string }; score: number }[];
    }[];
  }[];
}
export type CatalogLesson = CatalogLessonText | CatalogLessonVideo | CatalogLessonDoc | CatalogLessonTask | CatalogLessonQuiz;

export interface CatalogWeek {
  title: { fr: string; en: string; ar?: string };
  lessons: CatalogLesson[];
}

export interface CatalogTraining {
  title: { fr: string; en: string; ar?: string };
  description: { fr: string; en: string };
  career: string;          // ex. 'Développeur Full-Stack'
  domain: string;          // ex. 'Développement'
  priceTnd: number;
  priceEur: number;
  durationWeeks: number;
  weeks: CatalogWeek[];
}

// ──────────────────────────────────────────────────────────────────────
//   Helpers pour ecrire les vraies questions / reponses du quiz plus court
// ──────────────────────────────────────────────────────────────────────
const correct = (fr: string, en: string) => ({ text: { fr, en }, score: 1 });
const wrong   = (fr: string, en: string) => ({ text: { fr, en }, score: 0 });

// ──────────────────────────────────────────────────────────────────────
//   1. Developpement Web Full-Stack (8 semaines)
// ──────────────────────────────────────────────────────────────────────
const TRAINING_FULLSTACK: CatalogTraining = {
  title: { fr: 'Développement Web Full-Stack', en: 'Full-Stack Web Development' },
  description: {
    fr: 'Devenez développeur web full-stack en 8 semaines : HTML/CSS, JavaScript moderne, React, Node.js, MongoDB, authentification JWT et déploiement.',
    en: 'Become a full-stack web developer in 8 weeks: HTML/CSS, modern JavaScript, React, Node.js, MongoDB, JWT auth and deployment.',
  },
  career: 'Développeur Full-Stack',
  domain: 'Développement',
  priceTnd: 1200, priceEur: 380, durationWeeks: 8,
  weeks: [
    {
      title: { fr: 'Semaine 1 — HTML5 & CSS3', en: 'Week 1 — HTML5 & CSS3', ar: 'الأسبوع 1' },
      lessons: [
        {
          kind: 'text',
          title: { fr: 'Structure d\'une page HTML5', en: 'HTML5 page structure' },
          keyWords: ['HTML', 'sémantique', 'accessibilité'],
          htmlContent: `
<h2>Structure d'une page HTML5</h2>
<p>Une page HTML moderne s'organise autour de balises <strong>sémantiques</strong> : <code>&lt;header&gt;</code>, <code>&lt;nav&gt;</code>, <code>&lt;main&gt;</code>, <code>&lt;section&gt;</code>, <code>&lt;article&gt;</code>, <code>&lt;footer&gt;</code>.</p>
<p>L'utilisation des balises sémantiques améliore <strong>l'accessibilité</strong>, le <strong>SEO</strong> et la <strong>lisibilité</strong> du code.</p>
<pre><code>&lt;!DOCTYPE html&gt;
&lt;html lang="fr"&gt;
&lt;head&gt;
  &lt;meta charset="UTF-8" /&gt;
  &lt;title&gt;Mon site&lt;/title&gt;
&lt;/head&gt;
&lt;body&gt;
  &lt;header&gt;&lt;h1&gt;Bonjour&lt;/h1&gt;&lt;/header&gt;
  &lt;main&gt;&lt;p&gt;Contenu principal&lt;/p&gt;&lt;/main&gt;
&lt;/body&gt;
&lt;/html&gt;</code></pre>
<h3>Bonnes pratiques</h3>
<ul>
  <li>Toujours déclarer <code>&lt;!DOCTYPE html&gt;</code> et l'attribut <code>lang</code>.</li>
  <li>Un seul <code>&lt;h1&gt;</code> par page (le titre principal).</li>
  <li>Ajouter des attributs <code>alt</code> sur les images.</li>
</ul>`,
        },
        {
          kind: 'video',
          title: { fr: 'Tutoriel CSS Flexbox & Grid', en: 'CSS Flexbox & Grid tutorial' },
          keyWords: ['CSS', 'Flexbox', 'Grid'],
          videoUrl: 'https://www.youtube.com/watch?v=jV8B24rSN5o',
        },
        {
          kind: 'quiz',
          title: { fr: 'Quiz HTML / CSS', en: 'HTML / CSS Quiz' },
          description: { fr: 'Vérifiez vos acquis HTML5 et CSS3.', en: 'Check your HTML5 & CSS3 knowledge.' },
          durationMin: 15, deadLineInHours: 72, keyWords: ['HTML','CSS'],
          sections: [{
            text: { fr: 'Fondamentaux HTML/CSS', en: 'HTML/CSS fundamentals' },
            questions: [
              {
                text: { fr: 'Quelle balise HTML représente le titre principal d\'une page ?', en: 'Which HTML tag represents the main title of a page?' },
                questionType: 'simple',
                options: [
                  wrong('<title>', '<title>'),
                  correct('<h1>', '<h1>'),
                  wrong('<head>', '<head>'),
                  wrong('<header>', '<header>'),
                ],
              },
              {
                text: { fr: 'Quelle propriété CSS change la couleur du texte ?', en: 'Which CSS property changes the text color?' },
                questionType: 'simple',
                options: [
                  wrong('background', 'background'),
                  correct('color', 'color'),
                  wrong('font', 'font'),
                  wrong('text-color', 'text-color'),
                ],
              },
              {
                text: { fr: 'Quel sélecteur CSS cible un élément avec id="logo" ?', en: 'Which CSS selector targets an element with id="logo"?' },
                questionType: 'simple',
                options: [
                  wrong('.logo', '.logo'),
                  correct('#logo', '#logo'),
                  wrong('*logo', '*logo'),
                  wrong('logo', 'logo'),
                ],
              },
              {
                text: { fr: 'Quel affichage CSS active un conteneur Flexbox ?', en: 'Which CSS display value enables Flexbox?' },
                questionType: 'simple',
                options: [
                  wrong('display: block;', 'display: block;'),
                  wrong('display: inline;', 'display: inline;'),
                  correct('display: flex;', 'display: flex;'),
                  wrong('display: grid-flex;', 'display: grid-flex;'),
                ],
              },
              {
                text: { fr: 'Quelle balise HTML5 améliore l\'accessibilité d\'une zone de navigation ?', en: 'Which HTML5 tag improves accessibility of a nav area?' },
                questionType: 'simple',
                options: [
                  wrong('<div class="nav">', '<div class="nav">'),
                  correct('<nav>', '<nav>'),
                  wrong('<menu>', '<menu>'),
                  wrong('<aside>', '<aside>'),
                ],
              },
            ],
          }],
        },
        {
          kind: 'task',
          title: { fr: 'TP — Landing page responsive', en: 'Lab — Responsive landing page' },
          description: {
            fr: 'Réalisez une landing page responsive pour un produit fictif (header, hero, 3 sections de bénéfices, formulaire de contact, footer). Utilisez Flexbox et/ou Grid, et adaptez le design pour mobile, tablette et desktop.',
            en: 'Build a responsive landing page for a fictional product (header, hero, 3 benefit sections, contact form, footer). Use Flexbox and/or Grid and adapt for mobile, tablet, and desktop.',
          },
          learningOutcome: 'Maîtriser HTML5 sémantique et CSS3 (Flexbox/Grid).',
          deadLineInHours: 72, keyWords: ['HTML','CSS','responsive'],
        },
      ],
    },
    {
      title: { fr: 'Semaine 2 — JavaScript ES6+', en: 'Week 2 — JavaScript ES6+', ar: 'الأسبوع 2' },
      lessons: [
        {
          kind: 'text',
          title: { fr: 'Variables, scope et fonctions fléchées', en: 'Variables, scope and arrow functions' },
          keyWords: ['JavaScript','ES6','arrow'],
          htmlContent: `
<h2>let, const et fonctions fléchées</h2>
<p>Depuis ES6, on préfère <code>let</code> et <code>const</code> à <code>var</code> car ils ont une portée de bloc.</p>
<pre><code>const PI = 3.14;        // ne peut pas être réassigné
let count = 0;          // peut être réassigné
const double = x =&gt; x * 2;</code></pre>
<h3>Destructuration</h3>
<pre><code>const { name, age } = user;
const [first, ...rest] = items;</code></pre>
<h3>Async / Await</h3>
<pre><code>const fetchUser = async (id) =&gt; {
  const res = await fetch('/api/users/' + id);
  return res.json();
};</code></pre>`,
        },
        {
          kind: 'quiz',
          title: { fr: 'Quiz JavaScript Moderne', en: 'Modern JavaScript Quiz' },
          durationMin: 15, deadLineInHours: 72, keyWords: ['JavaScript','ES6'],
          sections: [{
            text: { fr: 'JavaScript ES6+', en: 'JavaScript ES6+' },
            questions: [
              {
                text: { fr: 'Quelle est la différence principale entre `let` et `const` ?', en: 'Main difference between `let` and `const`?' },
                questionType: 'simple',
                options: [
                  wrong('Aucune', 'No difference'),
                  correct('`const` empêche la réassignation, pas `let`', '`const` prevents reassignment, `let` does not'),
                  wrong('`let` est global, `const` local', '`let` is global, `const` local'),
                  wrong('`const` est asynchrone', '`const` is asynchronous'),
                ],
              },
              {
                text: { fr: 'Que retourne `[1,2,3].map(x => x*2)` ?', en: 'What does `[1,2,3].map(x => x*2)` return?' },
                questionType: 'simple',
                options: [
                  correct('[2, 4, 6]', '[2, 4, 6]'),
                  wrong('[1, 2, 3]', '[1, 2, 3]'),
                  wrong('12', '12'),
                  wrong('undefined', 'undefined'),
                ],
              },
              {
                text: { fr: 'Quel mot-clé attend la résolution d\'une Promise dans une fonction async ?', en: 'Which keyword waits for a Promise inside an async function?' },
                questionType: 'simple',
                options: [
                  wrong('yield', 'yield'),
                  correct('await', 'await'),
                  wrong('then', 'then'),
                  wrong('async', 'async'),
                ],
              },
              {
                text: { fr: 'Que fait `const { a, b } = obj;` ?', en: 'What does `const { a, b } = obj;` do?' },
                questionType: 'simple',
                options: [
                  correct('Extrait les propriétés a et b de obj', 'Destructures a and b from obj'),
                  wrong('Crée un nouvel objet avec a et b', 'Creates a new object with a and b'),
                  wrong('Supprime a et b de obj', 'Deletes a and b from obj'),
                  wrong('Génère une erreur', 'Throws an error'),
                ],
              },
              {
                text: { fr: 'Quel opérateur fusionne deux tableaux ?', en: 'Which operator merges two arrays?' },
                questionType: 'simple',
                options: [
                  wrong('+', '+'),
                  correct('`...` (spread)', '`...` (spread)'),
                  wrong('&', '&'),
                  wrong('merge()', 'merge()'),
                ],
              },
            ],
          }],
        },
        {
          kind: 'task',
          title: { fr: 'TP — Calculatrice interactive', en: 'Lab — Interactive calculator' },
          description: {
            fr: 'Construisez une calculatrice en JavaScript vanilla : opérations +, −, ×, ÷, gestion des erreurs (division par zéro), historique des calculs et raccourcis clavier.',
            en: 'Build a vanilla JS calculator: +, −, ×, ÷ ops, error handling (div by 0), calc history and keyboard shortcuts.',
          },
          learningOutcome: 'Manipuler le DOM, gérer les événements et structurer du JavaScript moderne.',
          deadLineInHours: 96, keyWords: ['JavaScript','DOM','events'],
        },
      ],
    },
    {
      title: { fr: 'Semaine 3 — Node.js & Express', en: 'Week 3 — Node.js & Express' },
      lessons: [
        {
          kind: 'text',
          title: { fr: 'Créer une API REST avec Express', en: 'Build a REST API with Express' },
          keyWords: ['Node.js','Express','REST'],
          htmlContent: `
<h2>Express en 5 minutes</h2>
<p>Express est le framework Node.js le plus utilisé pour créer des API REST.</p>
<pre><code>const express = require('express');
const app = express();
app.use(express.json());

app.get('/users', (req, res) =&gt; res.json([{ id: 1, name: 'Sarah' }]));
app.post('/users', (req, res) =&gt; res.status(201).json(req.body));

app.listen(3000, () =&gt; console.log('API sur :3000'));</code></pre>
<h3>Middleware</h3>
<p>Un middleware est une fonction <code>(req, res, next) =&gt; { ... }</code> qui intercepte les requêtes. Cas d'usage : authentification, logs, validation.</p>`,
        },
        {
          kind: 'task',
          title: { fr: 'TP — API REST CRUD', en: 'Lab — REST CRUD API' },
          description: {
            fr: 'Créez une API REST Express pour gérer des articles de blog : POST/GET/PUT/DELETE /articles, validation des entrées avec Joi ou Zod, gestion d\'erreurs centralisée, codes HTTP corrects (201/400/404/500).',
            en: 'Build an Express REST API to manage blog articles: POST/GET/PUT/DELETE /articles, input validation with Joi/Zod, centralized error handling, proper HTTP codes (201/400/404/500).',
          },
          learningOutcome: 'Construire une API REST conforme aux bonnes pratiques.',
          deadLineInHours: 120, keyWords: ['Node.js','Express','REST'],
        },
      ],
    },
    {
      title: { fr: 'Semaine 4 — MongoDB & Mongoose', en: 'Week 4 — MongoDB & Mongoose' },
      lessons: [
        {
          kind: 'text',
          title: { fr: 'Modélisation NoSQL avec Mongoose', en: 'NoSQL modeling with Mongoose' },
          keyWords: ['MongoDB','Mongoose','NoSQL'],
          htmlContent: `
<h2>Schémas Mongoose</h2>
<p>Mongoose ajoute une couche de typage et de validation sur MongoDB.</p>
<pre><code>const userSchema = new mongoose.Schema({
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age:      { type: Number, min: 18 },
  createdAt:{ type: Date,   default: Date.now },
});
const User = mongoose.model('User', userSchema);

// Création
await User.create({ email: 'a@b.com', password: 'hash' });

// Requête
const users = await User.find({ age: { $gte: 18 } });
</code></pre>`,
        },
        {
          kind: 'doc',
          title: { fr: 'Cheatsheet MongoDB', en: 'MongoDB Cheatsheet' },
          keyWords: ['MongoDB'],
          documents: [
            { title: { fr: 'Cheatsheet MongoDB (PDF)' }, url: 'https://www.africau.edu/images/default/sample.pdf' },
          ],
        },
        {
          kind: 'quiz',
          title: { fr: 'Quiz MongoDB', en: 'MongoDB Quiz' },
          durationMin: 12, deadLineInHours: 72, keyWords: ['MongoDB'],
          sections: [{
            text: { fr: 'Requêtes MongoDB', en: 'MongoDB queries' },
            questions: [
              {
                text: { fr: 'Quel opérateur signifie « supérieur ou égal » ?', en: 'Which operator means "greater or equal"?' },
                questionType: 'simple',
                options: [
                  wrong('$gt', '$gt'),
                  correct('$gte', '$gte'),
                  wrong('$ge', '$ge'),
                  wrong('$min', '$min'),
                ],
              },
              {
                text: { fr: 'Comment trouver tous les documents avec status="active" ?', en: 'Find all docs with status="active"?' },
                questionType: 'simple',
                options: [
                  correct('Model.find({ status: "active" })', 'Model.find({ status: "active" })'),
                  wrong('Model.search("active")', 'Model.search("active")'),
                  wrong('Model.where().equals("active")', 'Model.where().equals("active")'),
                  wrong('Model.query.active', 'Model.query.active'),
                ],
              },
              {
                text: { fr: 'Quel champ Mongoose force l\'unicité ?', en: 'Which Mongoose field enforces uniqueness?' },
                questionType: 'simple',
                options: [
                  wrong('required: true', 'required: true'),
                  correct('unique: true', 'unique: true'),
                  wrong('index: true', 'index: true'),
                  wrong('primary: true', 'primary: true'),
                ],
              },
              {
                text: { fr: 'Quel type Mongoose représente une référence vers un autre document ?', en: 'Which Mongoose type represents a ref to another doc?' },
                questionType: 'simple',
                options: [
                  wrong('String', 'String'),
                  correct('Schema.Types.ObjectId', 'Schema.Types.ObjectId'),
                  wrong('Schema.Ref', 'Schema.Ref'),
                  wrong('mongoose.Pointer', 'mongoose.Pointer'),
                ],
              },
            ],
          }],
        },
      ],
    },
    {
      title: { fr: 'Semaine 5 — React Fondamentaux', en: 'Week 5 — React Fundamentals' },
      lessons: [
        {
          kind: 'text',
          title: { fr: 'Composants et hooks', en: 'Components and hooks' },
          keyWords: ['React','hooks'],
          htmlContent: `
<h2>useState et useEffect</h2>
<pre><code>import { useState, useEffect } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  useEffect(() =&gt; {
    document.title = 'Count: ' + count;
  }, [count]);
  return (
    &lt;button onClick={() =&gt; setCount(c =&gt; c + 1)}&gt;
      Cliqué {count} fois
    &lt;/button&gt;
  );
}</code></pre>
<p>Les <strong>hooks</strong> permettent d'utiliser l'état et les effets dans des composants fonctionnels.</p>`,
        },
        {
          kind: 'video',
          title: { fr: 'React Hooks expliqués', en: 'React Hooks explained' },
          videoUrl: 'https://www.youtube.com/watch?v=dpw9EHDh2bM',
          keyWords: ['React','hooks'],
        },
        {
          kind: 'task',
          title: { fr: 'TP — Application TODO', en: 'Lab — TODO app' },
          description: {
            fr: 'Construisez une app TODO React : ajout, suppression, complétion, filtre (toutes / actives / terminées) et persistance localStorage. Composants : TodoList, TodoItem, AddTodo, Filter.',
            en: 'Build a React TODO app: add, delete, complete, filter (all / active / done) and localStorage persistence. Components: TodoList, TodoItem, AddTodo, Filter.',
          },
          learningOutcome: 'Maîtriser useState, useEffect et le découpage en composants.',
          deadLineInHours: 96, keyWords: ['React','hooks','TODO'],
        },
      ],
    },
    {
      title: { fr: 'Semaine 6 — Authentification JWT', en: 'Week 6 — JWT Authentication' },
      lessons: [
        {
          kind: 'text',
          title: { fr: 'JWT et bcrypt', en: 'JWT and bcrypt' },
          keyWords: ['JWT','bcrypt','auth'],
          htmlContent: `
<h2>Sécuriser une API avec JWT</h2>
<p>Un <strong>JWT</strong> (JSON Web Token) est un jeton signé qui prouve l'identité d'un utilisateur. Côté serveur, on hache le mot de passe avec <strong>bcrypt</strong>.</p>
<pre><code>// Inscription
const hashed = await bcrypt.hash(password, 10);
await User.create({ email, password: hashed });

// Connexion
const ok = await bcrypt.compare(password, user.password);
if (!ok) throw new Error('Bad credentials');
const token = jwt.sign({ id: user._id }, process.env.SECRET, { expiresIn: '7d' });</code></pre>`,
        },
        {
          kind: 'task',
          title: { fr: 'TP — Auth complete (signup, login, me)', en: 'Lab — Full auth (signup, login, me)' },
          description: {
            fr: 'Implémentez les routes POST /signup, POST /login et GET /me sur votre API Express. Le token JWT doit être transmis dans l\'en-tête Authorization. Hachage bcrypt avec 10 rounds. Tests Postman fournis.',
            en: 'Implement POST /signup, POST /login and GET /me on your Express API. JWT token must be passed in the Authorization header. bcrypt hashing with 10 rounds. Postman tests included.',
          },
          learningOutcome: 'Implémenter l\'authentification JWT complète.',
          deadLineInHours: 120, keyWords: ['JWT','auth','bcrypt'],
        },
      ],
    },
    {
      title: { fr: 'Semaine 7 — Déploiement', en: 'Week 7 — Deployment' },
      lessons: [
        {
          kind: 'doc',
          title: { fr: 'Déployer sur Render & Vercel', en: 'Deploy to Render & Vercel' },
          keyWords: ['déploiement','Render','Vercel'],
          documents: [
            { title: { fr: 'Guide Render (PDF)' }, url: 'https://www.africau.edu/images/default/sample.pdf' },
            { title: { fr: 'Guide Vercel (PDF)' }, url: 'https://www.w3.org/WAI/WCAG21/wcag21.pdf' },
          ],
        },
        {
          kind: 'task',
          title: { fr: 'TP — Mettre en ligne votre stack', en: 'Lab — Deploy your stack' },
          description: {
            fr: 'Déployez votre back Express sur Render et votre front React sur Vercel. Configurez les variables d\'environnement, la base MongoDB Atlas et un domaine personnalisé. Livrable : URL publique fonctionnelle + capture des dashboards.',
            en: 'Deploy your Express backend on Render and your React frontend on Vercel. Configure env vars, MongoDB Atlas and a custom domain. Deliverable: working public URL + dashboard screenshots.',
          },
          learningOutcome: 'Déployer une app fullstack en production.',
          deadLineInHours: 168, keyWords: ['déploiement','prod'],
        },
      ],
    },
    {
      title: { fr: 'Semaine 8 — Projet final', en: 'Week 8 — Final project' },
      lessons: [
        {
          kind: 'task',
          title: { fr: 'Projet final — Mini SaaS', en: 'Final project — Mini SaaS' },
          description: {
            fr: 'Construisez un mini SaaS fullstack au choix : todo collaboratif, blog avec commentaires, gestion de tickets… Critères : auth JWT, CRUD complet, design responsive, déployé en production, repo Git propre avec README. Soutenance vidéo de 5 minutes.',
            en: 'Build a fullstack mini SaaS of your choice: collaborative todo, blog with comments, ticket system… Criteria: JWT auth, full CRUD, responsive design, deployed in production, clean Git repo with README. 5-minute video defense.',
          },
          learningOutcome: 'Démontrer la maîtrise de toute la stack.',
          deadLineInHours: 240, keyWords: ['SaaS','projet','soutenance'],
        },
      ],
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────
//   2. React & TypeScript Avance (6 semaines)
// ──────────────────────────────────────────────────────────────────────
const TRAINING_REACT_TS: CatalogTraining = {
  title: { fr: 'React & TypeScript Avancé', en: 'Advanced React & TypeScript' },
  description: {
    fr: 'Passez React et TypeScript au niveau pro : hooks avancés, state management, performance, tests et architecture.',
    en: 'Take React & TypeScript to the pro level: advanced hooks, state management, performance, testing and architecture.',
  },
  career: 'Développeur Front-End',
  domain: 'Développement',
  priceTnd: 1500, priceEur: 480, durationWeeks: 6,
  weeks: [
    {
      title: { fr: 'Semaine 1 — TypeScript essentiels', en: 'Week 1 — TypeScript essentials' },
      lessons: [
        {
          kind: 'text',
          title: { fr: 'Types, interfaces et génériques', en: 'Types, interfaces and generics' },
          keyWords: ['TypeScript'],
          htmlContent: `
<h2>Interfaces vs Types</h2>
<pre><code>interface User { id: number; name: string; email?: string }
type Status = 'active' | 'banned' | 'pending';

function greet(u: User, s: Status): string {
  return \`\${u.name} (\${s})\`;
}

// Generique
function first&lt;T&gt;(arr: T[]): T | undefined { return arr[0]; }
const n = first&lt;number&gt;([1, 2, 3]);  // number | undefined</code></pre>`,
        },
        {
          kind: 'quiz',
          title: { fr: 'Quiz TypeScript', en: 'TypeScript Quiz' },
          durationMin: 10, deadLineInHours: 72, keyWords: ['TypeScript'],
          sections: [{
            text: { fr: 'Types et interfaces', en: 'Types and interfaces' },
            questions: [
              {
                text: { fr: 'Quelle syntaxe rend une propriété optionnelle ?', en: 'Which syntax makes a property optional?' },
                questionType: 'simple',
                options: [
                  wrong('email!: string', 'email!: string'),
                  correct('email?: string', 'email?: string'),
                  wrong('email: string | undefined', 'email: string | undefined'),
                  wrong('optional email: string', 'optional email: string'),
                ],
              },
              {
                text: { fr: 'Quel type représente "n\'importe quelle valeur, mais on doit la vérifier" ?', en: 'Type meaning "any value, but you must check it"?' },
                questionType: 'simple',
                options: [
                  wrong('any', 'any'),
                  correct('unknown', 'unknown'),
                  wrong('never', 'never'),
                  wrong('void', 'void'),
                ],
              },
              {
                text: { fr: 'Comment déclarer un type union « string OU number » ?', en: 'How to declare union "string OR number"?' },
                questionType: 'simple',
                options: [
                  wrong('string && number', 'string && number'),
                  correct('string | number', 'string | number'),
                  wrong('string + number', 'string + number'),
                  wrong('Union<string, number>', 'Union<string, number>'),
                ],
              },
              {
                text: { fr: 'Que fait `as const` sur un littéral ?', en: 'What does `as const` do on a literal?' },
                questionType: 'simple',
                options: [
                  correct('Le rend immuable et infère le type littéral', 'Makes it immutable and infers the literal type'),
                  wrong('Le convertit en constante runtime', 'Converts to runtime constant'),
                  wrong('Le supprime à la compilation', 'Removes it at compile time'),
                  wrong('Le rend global', 'Makes it global'),
                ],
              },
            ],
          }],
        },
      ],
    },
    {
      title: { fr: 'Semaine 2 — Hooks avancés', en: 'Week 2 — Advanced hooks' },
      lessons: [
        {
          kind: 'text',
          title: { fr: 'useMemo, useCallback, custom hooks', en: 'useMemo, useCallback, custom hooks' },
          keyWords: ['React','hooks','perf'],
          htmlContent: `
<h2>Optimisation avec useMemo et useCallback</h2>
<p><code>useMemo</code> mémorise une valeur calculée ; <code>useCallback</code> mémorise une fonction.</p>
<pre><code>const sorted = useMemo(
  () =&gt; items.sort((a, b) =&gt; a.name.localeCompare(b.name)),
  [items],
);

const handleClick = useCallback(
  (id: string) =&gt; deleteItem(id),
  [deleteItem],
);</code></pre>
<h3>Custom hook</h3>
<pre><code>function useDebounce&lt;T&gt;(value: T, delay = 300): T {
  const [v, setV] = useState(value);
  useEffect(() =&gt; {
    const t = setTimeout(() =&gt; setV(value), delay);
    return () =&gt; clearTimeout(t);
  }, [value, delay]);
  return v;
}</code></pre>`,
        },
        {
          kind: 'task',
          title: { fr: 'TP — Custom hook useFetch', en: 'Lab — useFetch custom hook' },
          description: {
            fr: 'Créez un hook `useFetch<T>(url)` qui retourne `{ data, loading, error }`, gère l\'annulation avec AbortController et le cache. Tests unitaires avec React Testing Library.',
            en: 'Create a `useFetch<T>(url)` hook returning `{ data, loading, error }`, handles cancellation with AbortController and caching. Unit tests with React Testing Library.',
          },
          learningOutcome: 'Concevoir des custom hooks réutilisables et typés.',
          deadLineInHours: 96, keyWords: ['React','hooks','TypeScript'],
        },
      ],
    },
    {
      title: { fr: 'Semaine 3 — State Management', en: 'Week 3 — State Management' },
      lessons: [
        {
          kind: 'video',
          title: { fr: 'Zustand vs Redux Toolkit', en: 'Zustand vs Redux Toolkit' },
          videoUrl: 'https://www.youtube.com/watch?v=zpQ9twR3MfM',
          keyWords: ['Zustand','Redux'],
        },
        {
          kind: 'task',
          title: { fr: 'TP — Migration Context → Zustand', en: 'Lab — Migrate Context → Zustand' },
          description: {
            fr: 'Sur l\'app TODO précédente, migrez le state global de Context vers Zustand. Mesurez la différence de re-renders avec React DevTools Profiler.',
            en: 'On the previous TODO app, migrate global state from Context to Zustand. Measure re-render diff with React DevTools Profiler.',
          },
          learningOutcome: 'Choisir et intégrer un outil de state management.',
          deadLineInHours: 72, keyWords: ['Zustand','state'],
        },
      ],
    },
    {
      title: { fr: 'Semaine 4 — Performance', en: 'Week 4 — Performance' },
      lessons: [
        {
          kind: 'text',
          title: { fr: 'React.memo, code splitting, virtualisation', en: 'React.memo, code splitting, virtualization' },
          keyWords: ['perf','React'],
          htmlContent: `
<h2>Trois leviers majeurs</h2>
<ul>
  <li><strong>React.memo</strong> : évite les re-renders inutiles d'un composant.</li>
  <li><strong>Code splitting</strong> : <code>const Page = lazy(() =&gt; import('./Page'))</code></li>
  <li><strong>Virtualisation</strong> : afficher seulement les lignes visibles (react-window, TanStack Virtual).</li>
</ul>`,
        },
        {
          kind: 'quiz',
          title: { fr: 'Quiz Performance React', en: 'React Performance Quiz' },
          durationMin: 10, deadLineInHours: 72, keyWords: ['perf','React'],
          sections: [{
            text: { fr: 'Performance React', en: 'React performance' },
            questions: [
              {
                text: { fr: 'Quel hook mémorise une valeur calculée ?', en: 'Which hook memoizes a computed value?' },
                questionType: 'simple',
                options: [
                  wrong('useEffect', 'useEffect'),
                  correct('useMemo', 'useMemo'),
                  wrong('useState', 'useState'),
                  wrong('useReducer', 'useReducer'),
                ],
              },
              {
                text: { fr: 'À quoi sert React.memo ?', en: 'What does React.memo do?' },
                questionType: 'simple',
                options: [
                  wrong('Cacher un composant', 'Hide a component'),
                  correct('Empêcher le re-render si les props n\'ont pas changé', 'Skip re-render if props unchanged'),
                  wrong('Mémoriser une valeur', 'Memoize a value'),
                  wrong('Mémoriser un effet', 'Memoize an effect'),
                ],
              },
              {
                text: { fr: 'Quelle technique affiche seulement les lignes visibles d\'une longue liste ?', en: 'Which technique renders only visible rows of a long list?' },
                questionType: 'simple',
                options: [
                  wrong('Pagination serveur', 'Server pagination'),
                  correct('Virtualisation', 'Virtualization'),
                  wrong('Code splitting', 'Code splitting'),
                  wrong('Suspense', 'Suspense'),
                ],
              },
            ],
          }],
        },
      ],
    },
    {
      title: { fr: 'Semaine 5 — Tests', en: 'Week 5 — Testing' },
      lessons: [
        {
          kind: 'task',
          title: { fr: 'TP — Coverage 80% avec Vitest', en: 'Lab — 80% coverage with Vitest' },
          description: {
            fr: 'Écrivez des tests unitaires et d\'intégration pour votre app TODO avec Vitest + React Testing Library. Objectif : 80% de coverage. Mock fetch via MSW.',
            en: 'Write unit and integration tests for your TODO app with Vitest + React Testing Library. Target: 80% coverage. Mock fetch with MSW.',
          },
          learningOutcome: 'Mettre en place une stratégie de tests front fiable.',
          deadLineInHours: 120, keyWords: ['tests','Vitest','RTL'],
        },
      ],
    },
    {
      title: { fr: 'Semaine 6 — Projet final', en: 'Week 6 — Final project' },
      lessons: [
        {
          kind: 'task',
          title: { fr: 'Projet final — Dashboard React/TS', en: 'Final project — React/TS Dashboard' },
          description: {
            fr: 'Construisez un dashboard analytics React/TS : graphiques (Recharts), filtres, table virtuelle 10 000 lignes, lazy loading des routes, dark mode, 100% TypeScript strict, tests 80%+, Lighthouse score > 90.',
            en: 'Build an analytics dashboard in React/TS: charts (Recharts), filters, virtual table 10k rows, route lazy loading, dark mode, 100% strict TS, 80%+ tests, Lighthouse > 90.',
          },
          learningOutcome: 'Démontrer un niveau pro React + TypeScript.',
          deadLineInHours: 240, keyWords: ['React','TypeScript','dashboard'],
        },
      ],
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────
//   3. Data Science avec Python (7 semaines)
// ──────────────────────────────────────────────────────────────────────
const TRAINING_DATA_SCIENCE: CatalogTraining = {
  title: { fr: 'Data Science avec Python', en: 'Data Science with Python' },
  description: {
    fr: 'De Python aux modèles ML : Pandas, NumPy, visualisation, statistiques et machine learning avec scikit-learn.',
    en: 'From Python to ML models: Pandas, NumPy, visualization, stats and machine learning with scikit-learn.',
  },
  career: 'Data Scientist',
  domain: 'Data & IA',
  priceTnd: 1400, priceEur: 450, durationWeeks: 7,
  weeks: [
    {
      title: { fr: 'Semaine 1 — Python pour la Data', en: 'Week 1 — Python for Data' },
      lessons: [
        {
          kind: 'text',
          title: { fr: 'Listes, dicos, comprehensions', en: 'Lists, dicts, comprehensions' },
          keyWords: ['Python'],
          htmlContent: `
<h2>Comprehensions et collections</h2>
<pre><code># Liste
squares = [x*x for x in range(10) if x % 2 == 0]
# {0, 4, 16, 36, 64}

# Dictionnaire
ages = {p['name']: p['age'] for p in people}

# Set
unique_emails = {u.email for u in users}</code></pre>`,
        },
        {
          kind: 'quiz',
          title: { fr: 'Quiz Python Basics', en: 'Python Basics Quiz' },
          durationMin: 10, deadLineInHours: 72, keyWords: ['Python'],
          sections: [{
            text: { fr: 'Python fondamentaux', en: 'Python fundamentals' },
            questions: [
              {
                text: { fr: 'Que retourne `len({"a":1,"b":2})` ?', en: 'What does `len({"a":1,"b":2})` return?' },
                questionType: 'simple',
                options: [
                  wrong('1', '1'),
                  correct('2', '2'),
                  wrong('3', '3'),
                  wrong('Erreur', 'Error'),
                ],
              },
              {
                text: { fr: 'Quelle structure interdit les doublons ?', en: 'Which structure forbids duplicates?' },
                questionType: 'simple',
                options: [
                  wrong('list', 'list'),
                  wrong('tuple', 'tuple'),
                  correct('set', 'set'),
                  wrong('dict', 'dict'),
                ],
              },
              {
                text: { fr: 'Que retourne `list(range(1, 5))` ?', en: 'What does `list(range(1, 5))` return?' },
                questionType: 'simple',
                options: [
                  wrong('[1, 2, 3, 4, 5]', '[1, 2, 3, 4, 5]'),
                  correct('[1, 2, 3, 4]', '[1, 2, 3, 4]'),
                  wrong('[0, 1, 2, 3, 4]', '[0, 1, 2, 3, 4]'),
                  wrong('[1, 5]', '[1, 5]'),
                ],
              },
            ],
          }],
        },
      ],
    },
    {
      title: { fr: 'Semaine 2 — NumPy & Pandas', en: 'Week 2 — NumPy & Pandas' },
      lessons: [
        {
          kind: 'text',
          title: { fr: 'DataFrames Pandas', en: 'Pandas DataFrames' },
          keyWords: ['Pandas','NumPy'],
          htmlContent: `
<h2>Pandas : chargement & filtrage</h2>
<pre><code>import pandas as pd

df = pd.read_csv('sales.csv')
df['revenue'] = df['price'] * df['qty']
top = df[df.revenue &gt; 1000].sort_values('revenue', ascending=False).head(10)
top.to_excel('top10.xlsx', index=False)</code></pre>`,
        },
        {
          kind: 'task',
          title: { fr: 'TP — Analyse ventes Pandas', en: 'Lab — Sales analysis with Pandas' },
          description: {
            fr: 'À partir du dataset sales.csv (fourni), répondez à : top 10 produits, CA mensuel, panier moyen par client, taux de retour. Livrable : notebook Jupyter commenté + 4 graphiques.',
            en: 'From sales.csv (provided), answer: top 10 products, monthly revenue, avg basket per customer, return rate. Deliverable: commented Jupyter notebook + 4 charts.',
          },
          learningOutcome: 'Manipuler des DataFrames pour répondre à des questions métier.',
          deadLineInHours: 96, keyWords: ['Pandas','EDA'],
        },
      ],
    },
    {
      title: { fr: 'Semaine 3 — Visualisation', en: 'Week 3 — Visualization' },
      lessons: [
        {
          kind: 'task',
          title: { fr: 'TP — Dashboard Seaborn', en: 'Lab — Seaborn dashboard' },
          description: {
            fr: 'Créez un dashboard exploratoire avec Seaborn et Matplotlib : distribution, corrélations, heatmap, boxplots, pairplot. Choisissez un dataset Kaggle (Titanic, Iris, Housing).',
            en: 'Build an EDA dashboard with Seaborn and Matplotlib: distribution, correlations, heatmap, boxplots, pairplot. Pick a Kaggle dataset (Titanic, Iris, Housing).',
          },
          learningOutcome: 'Visualiser efficacement un dataset pour en extraire des insights.',
          deadLineInHours: 72, keyWords: ['visualisation','Seaborn'],
        },
      ],
    },
    {
      title: { fr: 'Semaine 4 — Statistiques', en: 'Week 4 — Statistics' },
      lessons: [
        {
          kind: 'quiz',
          title: { fr: 'Quiz Statistiques', en: 'Statistics Quiz' },
          durationMin: 12, deadLineInHours: 72, keyWords: ['stats'],
          sections: [{
            text: { fr: 'Statistiques pour la data', en: 'Statistics for data' },
            questions: [
              {
                text: { fr: 'Quelle mesure de tendance centrale est sensible aux valeurs extrêmes ?', en: 'Which central tendency measure is sensitive to outliers?' },
                questionType: 'simple',
                options: [
                  correct('Moyenne arithmétique', 'Arithmetic mean'),
                  wrong('Médiane', 'Median'),
                  wrong('Mode', 'Mode'),
                  wrong('Quartile', 'Quartile'),
                ],
              },
              {
                text: { fr: 'Que mesure l\'écart-type ?', en: 'What does standard deviation measure?' },
                questionType: 'simple',
                options: [
                  wrong('La moyenne', 'The mean'),
                  correct('La dispersion autour de la moyenne', 'The spread around the mean'),
                  wrong('La médiane', 'The median'),
                  wrong('L\'asymétrie', 'Skewness'),
                ],
              },
              {
                text: { fr: 'Quelle valeur de p-value permet de rejeter H0 à 5% ?', en: 'Which p-value lets you reject H0 at 5%?' },
                questionType: 'simple',
                options: [
                  wrong('p > 0.05', 'p > 0.05'),
                  correct('p < 0.05', 'p < 0.05'),
                  wrong('p = 0.05', 'p = 0.05'),
                  wrong('p = 1', 'p = 1'),
                ],
              },
            ],
          }],
        },
      ],
    },
    {
      title: { fr: 'Semaine 5 — Machine Learning', en: 'Week 5 — Machine Learning' },
      lessons: [
        {
          kind: 'video',
          title: { fr: 'scikit-learn en pratique', en: 'scikit-learn in practice' },
          videoUrl: 'https://www.youtube.com/watch?v=0B5eIE_1vpU',
          keyWords: ['ML','scikit-learn'],
        },
        {
          kind: 'task',
          title: { fr: 'TP — Modele de classification', en: 'Lab — Classification model' },
          description: {
            fr: 'Entraînez un modèle de classification (RandomForest, LogisticRegression) sur le dataset Titanic. Split train/test 80/20, accuracy, matrice de confusion, courbe ROC. Comparez 3 algorithmes.',
            en: 'Train a classification model (RandomForest, LogisticRegression) on Titanic. 80/20 split, accuracy, confusion matrix, ROC curve. Compare 3 algos.',
          },
          learningOutcome: 'Construire un pipeline ML supervisé complet.',
          deadLineInHours: 120, keyWords: ['ML','classification'],
        },
      ],
    },
    {
      title: { fr: 'Semaine 6 — Deep Learning intro', en: 'Week 6 — Deep Learning intro' },
      lessons: [
        {
          kind: 'text',
          title: { fr: 'Reseaux de neurones avec Keras', en: 'Neural networks with Keras' },
          keyWords: ['Deep Learning','Keras'],
          htmlContent: `
<h2>MLP minimaliste</h2>
<pre><code>from tensorflow import keras

model = keras.Sequential([
  keras.layers.Dense(64, activation='relu', input_shape=(20,)),
  keras.layers.Dense(64, activation='relu'),
  keras.layers.Dense(1,  activation='sigmoid'),
])
model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
model.fit(X_train, y_train, epochs=10, validation_split=0.2)</code></pre>`,
        },
      ],
    },
    {
      title: { fr: 'Semaine 7 — Projet final', en: 'Week 7 — Final project' },
      lessons: [
        {
          kind: 'task',
          title: { fr: 'Projet final — Modele de bout en bout', en: 'Final project — End-to-end model' },
          description: {
            fr: 'Choisissez un dataset Kaggle, posez une problématique business, livrez un notebook complet (EDA, preprocessing, 3 modèles comparés, métriques justifiées, conclusion). Bonus : Streamlit app.',
            en: 'Pick a Kaggle dataset, frame a business problem, deliver a full notebook (EDA, preprocessing, 3 compared models, justified metrics, conclusion). Bonus: Streamlit app.',
          },
          learningOutcome: 'Mener un projet data de bout en bout.',
          deadLineInHours: 240, keyWords: ['projet','ML','EDA'],
        },
      ],
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────
//   4. UX/UI Design avec Figma (5 semaines)
// ──────────────────────────────────────────────────────────────────────
const TRAINING_UXUI: CatalogTraining = {
  title: { fr: 'UX/UI Design avec Figma', en: 'UX/UI Design with Figma' },
  description: { fr: 'Apprenez à concevoir des interfaces utilisables, esthétiques et accessibles avec Figma.', en: 'Design usable, beautiful and accessible UIs with Figma.' },
  career: 'UX/UI Designer', domain: 'Design',
  priceTnd: 1000, priceEur: 320, durationWeeks: 5,
  weeks: [
    {
      title: { fr: 'Semaine 1 — Principes UX', en: 'Week 1 — UX principles' },
      lessons: [
        {
          kind: 'text',
          title: { fr: 'Les lois de l\'UX', en: 'Laws of UX' },
          keyWords: ['UX','Heuristiques'],
          htmlContent: `
<h2>10 heuristiques de Nielsen</h2>
<ol>
  <li>Visibilité de l'état du système</li>
  <li>Correspondance avec le monde réel</li>
  <li>Contrôle et liberté</li>
  <li>Cohérence et standards</li>
  <li>Prévention des erreurs</li>
  <li>Reconnaissance plutôt que rappel</li>
  <li>Flexibilité et efficacité</li>
  <li>Design esthétique et minimaliste</li>
  <li>Aider à reconnaître et corriger les erreurs</li>
  <li>Documentation accessible</li>
</ol>`,
        },
        {
          kind: 'quiz',
          title: { fr: 'Quiz UX', en: 'UX Quiz' },
          durationMin: 8, deadLineInHours: 48, keyWords: ['UX'],
          sections: [{
            text: { fr: 'Principes UX', en: 'UX principles' },
            questions: [
              {
                text: { fr: 'Quelle loi UX dit que les éléments proches sont perçus comme groupés ?', en: 'Which UX law says nearby elements are perceived as grouped?' },
                questionType: 'simple',
                options: [
                  correct('Loi de proximité', 'Law of proximity'),
                  wrong('Loi de Hick', 'Hick\'s law'),
                  wrong('Loi de Fitts', 'Fitts\'s law'),
                  wrong('Loi de Jakob', 'Jakob\'s law'),
                ],
              },
              {
                text: { fr: 'Que dit la loi de Fitts ?', en: 'What does Fitts\'s law state?' },
                questionType: 'simple',
                options: [
                  wrong('Plus il y a de choix, plus la décision est lente', 'More choices = slower decision'),
                  correct('Plus une cible est grande et proche, plus elle est rapide à atteindre', 'Larger, closer targets are faster to hit'),
                  wrong('On se souvient mieux du premier élément', 'First element is remembered best'),
                  wrong('Les utilisateurs préfèrent ce qu\'ils connaissent', 'Users prefer what they know'),
                ],
              },
              {
                text: { fr: 'Quel principe limite le nombre d\'options pour accélérer la décision ?', en: 'Which principle limits options to speed decisions?' },
                questionType: 'simple',
                options: [
                  correct('Loi de Hick', 'Hick\'s law'),
                  wrong('Loi de Miller', 'Miller\'s law'),
                  wrong('Loi de proximité', 'Law of proximity'),
                  wrong('Loi de Jakob', 'Jakob\'s law'),
                ],
              },
            ],
          }],
        },
      ],
    },
    {
      title: { fr: 'Semaine 2 — Figma basics', en: 'Week 2 — Figma basics' },
      lessons: [
        {
          kind: 'video',
          title: { fr: 'Figma en 1 heure', en: 'Figma in 1 hour' },
          videoUrl: 'https://www.youtube.com/watch?v=jwCmIBJ8Jtc',
          keyWords: ['Figma'],
        },
        {
          kind: 'task',
          title: { fr: 'TP — Mobile app onboarding', en: 'Lab — Mobile onboarding screens' },
          description: {
            fr: 'Concevez 4 écrans d\'onboarding pour une app mobile fictive (fitness, finance, social…) : splash, intro 1, intro 2, signup. Utilisez Auto Layout et composants.',
            en: 'Design 4 onboarding screens for a fictional mobile app: splash, intro 1, intro 2, signup. Use Auto Layout and components.',
          },
          learningOutcome: 'Maîtriser Auto Layout et la création de composants.',
          deadLineInHours: 72, keyWords: ['Figma','Auto Layout'],
        },
      ],
    },
    {
      title: { fr: 'Semaine 3 — Wireframing & Prototypage', en: 'Week 3 — Wireframing & Prototyping' },
      lessons: [
        {
          kind: 'task',
          title: { fr: 'TP — Prototype interactif', en: 'Lab — Interactive prototype' },
          description: {
            fr: 'Transformez votre maquette onboarding en prototype interactif avec animations Smart Animate. Présentez le parcours en vidéo screen-record (60 sec).',
            en: 'Turn your onboarding mockup into an interactive prototype with Smart Animate. Present the flow as 60-sec screen recording.',
          },
          learningOutcome: 'Réaliser un prototype animé crédible.',
          deadLineInHours: 72, keyWords: ['prototype','Smart Animate'],
        },
      ],
    },
    {
      title: { fr: 'Semaine 4 — Design System', en: 'Week 4 — Design System' },
      lessons: [
        {
          kind: 'text',
          title: { fr: 'Tokens, composants, variantes', en: 'Tokens, components, variants' },
          keyWords: ['design system'],
          htmlContent: `
<h2>Atomic Design</h2>
<p>Brad Frost propose 5 niveaux : atomes (couleurs, typographies), molécules (input + label), organismes (formulaire), templates, pages.</p>
<p>Dans Figma, on les modélise via <strong>Styles</strong>, <strong>Variables</strong> et <strong>Composants avec variantes</strong>.</p>`,
        },
      ],
    },
    {
      title: { fr: 'Semaine 5 — Projet final', en: 'Week 5 — Final project' },
      lessons: [
        {
          kind: 'task',
          title: { fr: 'Projet final — App complete', en: 'Final project — Complete app' },
          description: {
            fr: 'Concevez une app au choix (15-20 écrans), avec design system complet, prototype navigable et présentation Figma. Soutenance 10 minutes.',
            en: 'Design an app of your choice (15-20 screens) with complete design system, navigable prototype and Figma presentation. 10-min defense.',
          },
          learningOutcome: 'Livrer une app design-systemisée prête au dev.',
          deadLineInHours: 240, keyWords: ['app','design system'],
        },
      ],
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────
//   5. Marketing Digital & SEO (5 semaines)
// ──────────────────────────────────────────────────────────────────────
const TRAINING_SEO: CatalogTraining = {
  title: { fr: 'Marketing Digital & SEO', en: 'Digital Marketing & SEO' },
  description: { fr: 'Acquisition organique, SEO on-page/off-page, Google Analytics et Search Console.', en: 'Organic acquisition, on-page/off-page SEO, Google Analytics and Search Console.' },
  career: 'Spécialiste SEO', domain: 'Marketing Digital',
  priceTnd: 900, priceEur: 290, durationWeeks: 5,
  weeks: [
    {
      title: { fr: 'Semaine 1 — Fondamentaux SEO', en: 'Week 1 — SEO Fundamentals' },
      lessons: [
        {
          kind: 'text',
          title: { fr: 'Comment fonctionne Google ?', en: 'How does Google work?' },
          keyWords: ['SEO','Google'],
          htmlContent: `
<h2>Crawl, index, ranking</h2>
<p>Google fonctionne en 3 étapes : <strong>crawl</strong> (Googlebot lit), <strong>index</strong> (stocke), <strong>ranking</strong> (classe selon ~200 facteurs : pertinence, autorité, expérience utilisateur, fraîcheur…).</p>`,
        },
        {
          kind: 'quiz',
          title: { fr: 'Quiz SEO', en: 'SEO Quiz' },
          durationMin: 8, deadLineInHours: 48, keyWords: ['SEO'],
          sections: [{
            text: { fr: 'Fondamentaux SEO', en: 'SEO fundamentals' },
            questions: [
              {
                text: { fr: 'Quelle balise HTML pèse le plus en SEO ?', en: 'Which HTML tag matters most for SEO?' },
                questionType: 'simple',
                options: [
                  wrong('<meta name="description">', '<meta name="description">'),
                  correct('<title>', '<title>'),
                  wrong('<h2>', '<h2>'),
                  wrong('<strong>', '<strong>'),
                ],
              },
              {
                text: { fr: 'Que mesure le « PageSpeed Insights » ?', en: 'What does PageSpeed Insights measure?' },
                questionType: 'simple',
                options: [
                  wrong('Le nombre de visiteurs', 'Visitor count'),
                  correct('Les performances de chargement et Core Web Vitals', 'Loading perf and Core Web Vitals'),
                  wrong('La densité de mots-clés', 'Keyword density'),
                  wrong('Le PageRank', 'PageRank'),
                ],
              },
              {
                text: { fr: 'Un backlink de qualité provient de…', en: 'A quality backlink comes from…' },
                questionType: 'simple',
                options: [
                  wrong('Un site avec beaucoup de pubs', 'A site full of ads'),
                  correct('Un site faisant autorité et thématiquement proche', 'An authoritative, topically relevant site'),
                  wrong('Un annuaire généraliste', 'A generic directory'),
                  wrong('Une PBN', 'A PBN'),
                ],
              },
            ],
          }],
        },
      ],
    },
    {
      title: { fr: 'Semaine 2 — SEO On-page', en: 'Week 2 — On-page SEO' },
      lessons: [
        {
          kind: 'task',
          title: { fr: 'TP — Audit On-page complet', en: 'Lab — Full On-page audit' },
          description: {
            fr: 'Auditez un site (le vôtre ou un concurrent) avec Screaming Frog : titres, meta descriptions, h1, alt, vitesse, mobile. Livrable : rapport PDF avec recommandations priorisées.',
            en: 'Audit a website (yours or a competitor) with Screaming Frog: titles, meta, h1, alt, speed, mobile. Deliverable: PDF report with prioritized recommendations.',
          },
          learningOutcome: 'Réaliser un audit SEO on-page actionnable.',
          deadLineInHours: 96, keyWords: ['SEO','audit'],
        },
      ],
    },
    {
      title: { fr: 'Semaine 3 — SEO Off-page & Backlinks', en: 'Week 3 — Off-page SEO & Backlinks' },
      lessons: [
        {
          kind: 'text',
          title: { fr: 'Linkbuilding ethique', en: 'Ethical linkbuilding' },
          keyWords: ['backlinks','linkbuilding'],
          htmlContent: `<p>Le linkbuilding consiste à obtenir des backlinks de qualité : guest posting, échanges de liens, contenu viral, RP digitales. Évitez les fermes de liens, sous peine de pénalité Penguin.</p>`,
        },
      ],
    },
    {
      title: { fr: 'Semaine 4 — GA4 & Search Console', en: 'Week 4 — GA4 & Search Console' },
      lessons: [
        {
          kind: 'video',
          title: { fr: 'Google Analytics 4 explique', en: 'Google Analytics 4 explained' },
          videoUrl: 'https://www.youtube.com/watch?v=eRBNsbqcwk0',
          keyWords: ['GA4'],
        },
        {
          kind: 'task',
          title: { fr: 'TP — Tableau de bord GA4', en: 'Lab — GA4 dashboard' },
          description: {
            fr: 'Installez GA4 sur un site test, configurez 5 événements personnalisés et 3 conversions. Construisez un dashboard Looker Studio avec sessions, taux de conversion, sources, pages les plus vues.',
            en: 'Set up GA4 on a test site, configure 5 custom events and 3 conversions. Build a Looker Studio dashboard with sessions, conversion rate, sources, top pages.',
          },
          learningOutcome: 'Configurer GA4 et restituer la donnée.',
          deadLineInHours: 96, keyWords: ['GA4','Looker'],
        },
      ],
    },
    {
      title: { fr: 'Semaine 5 — Audit final', en: 'Week 5 — Final audit' },
      lessons: [
        {
          kind: 'task',
          title: { fr: 'Projet final — Stratégie SEO complete', en: 'Final project — Full SEO strategy' },
          description: {
            fr: 'Construisez une stratégie SEO 6 mois pour un client réel ou fictif : audit, plan de mots-clés (50+), contenu, netlinking, suivi KPI. Livrable : présentation 20 slides + roadmap.',
            en: 'Build a 6-month SEO strategy for a real or fictional client: audit, keyword plan (50+), content, link-building, KPI tracking. Deliverable: 20-slide deck + roadmap.',
          },
          learningOutcome: 'Piloter une stratégie SEO de A à Z.',
          deadLineInHours: 240, keyWords: ['SEO','stratégie'],
        },
      ],
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────
//   6. DevOps avec Docker & Kubernetes (6 semaines)
// ──────────────────────────────────────────────────────────────────────
const TRAINING_DEVOPS: CatalogTraining = {
  title: { fr: 'DevOps avec Docker & Kubernetes', en: 'DevOps with Docker & Kubernetes' },
  description: { fr: 'Linux, Git, Docker, Kubernetes, CI/CD : le parcours DevOps complet.', en: 'Linux, Git, Docker, Kubernetes, CI/CD: the full DevOps journey.' },
  career: 'Ingénieur DevOps', domain: 'Cloud & DevOps',
  priceTnd: 1600, priceEur: 510, durationWeeks: 6,
  weeks: [
    {
      title: { fr: 'Semaine 1 — Linux & Bash', en: 'Week 1 — Linux & Bash' },
      lessons: [
        {
          kind: 'text',
          title: { fr: 'Commandes Bash essentielles', en: 'Essential Bash commands' },
          keyWords: ['Linux','Bash'],
          htmlContent: `
<pre><code># Naviguer
cd /var/log &amp;&amp; ls -lah

# Chercher
grep -r 'ERROR' /var/log/ --include='*.log'
find . -type f -name '*.ts' -mtime -1

# Pipes
ps aux | grep node | awk '{print $2}' | xargs kill -9</code></pre>`,
        },
        {
          kind: 'quiz',
          title: { fr: 'Quiz Linux/Bash', en: 'Linux/Bash Quiz' },
          durationMin: 10, deadLineInHours: 48, keyWords: ['Linux'],
          sections: [{
            text: { fr: 'Linux essentiels', en: 'Linux essentials' },
            questions: [
              {
                text: { fr: 'Quelle commande affiche le contenu d\'un fichier ?', en: 'Which command shows a file content?' },
                questionType: 'simple',
                options: [
                  correct('cat fichier.txt', 'cat fichier.txt'),
                  wrong('show fichier.txt', 'show fichier.txt'),
                  wrong('read fichier.txt', 'read fichier.txt'),
                  wrong('file fichier.txt', 'file fichier.txt'),
                ],
              },
              {
                text: { fr: 'Comment rendre un script exécutable ?', en: 'How to make a script executable?' },
                questionType: 'simple',
                options: [
                  wrong('chown +x script.sh', 'chown +x script.sh'),
                  correct('chmod +x script.sh', 'chmod +x script.sh'),
                  wrong('chmod 000 script.sh', 'chmod 000 script.sh'),
                  wrong('exec script.sh', 'exec script.sh'),
                ],
              },
              {
                text: { fr: 'Quelle commande liste les processus ?', en: 'Which command lists processes?' },
                questionType: 'simple',
                options: [
                  wrong('ls -p', 'ls -p'),
                  correct('ps aux', 'ps aux'),
                  wrong('proc list', 'proc list'),
                  wrong('jobs', 'jobs'),
                ],
              },
            ],
          }],
        },
      ],
    },
    {
      title: { fr: 'Semaine 2 — Git & GitHub', en: 'Week 2 — Git & GitHub' },
      lessons: [
        {
          kind: 'task',
          title: { fr: 'TP — Git workflow complet', en: 'Lab — Full Git workflow' },
          description: {
            fr: 'Sur un repo de test : créez 3 branches, simulez un conflit de merge, résolvez-le, ouvrez une PR, faites un rebase interactif, créez un tag de release. Livrable : repo public + capture de l\'arbre Git.',
            en: 'On a test repo: create 3 branches, simulate a merge conflict, resolve it, open a PR, do an interactive rebase, create a release tag. Deliverable: public repo + Git graph screenshot.',
          },
          learningOutcome: 'Maîtriser Git en équipe.',
          deadLineInHours: 72, keyWords: ['Git','GitHub'],
        },
      ],
    },
    {
      title: { fr: 'Semaine 3 — Docker', en: 'Week 3 — Docker' },
      lessons: [
        {
          kind: 'text',
          title: { fr: 'Dockerfile et best practices', en: 'Dockerfile and best practices' },
          keyWords: ['Docker'],
          htmlContent: `
<pre><code>FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/app.js"]</code></pre>
<p>Le <strong>multi-stage build</strong> réduit la taille de l'image finale.</p>`,
        },
        {
          kind: 'video',
          title: { fr: 'Docker en 100 secondes', en: 'Docker in 100 seconds' },
          videoUrl: 'https://www.youtube.com/watch?v=Gjnup-PuquQ',
          keyWords: ['Docker'],
        },
        {
          kind: 'task',
          title: { fr: 'TP — Conteneuriser une stack', en: 'Lab — Containerize a stack' },
          description: {
            fr: 'Conteneurisez une app Node + Mongo avec Dockerfile multi-stage et docker-compose. Volumes pour la DB, réseau interne, health checks. Image < 200 MB.',
            en: 'Containerize a Node + Mongo app with multi-stage Dockerfile and docker-compose. DB volumes, internal network, health checks. Image < 200 MB.',
          },
          learningOutcome: 'Produire des images Docker prod-ready.',
          deadLineInHours: 96, keyWords: ['Docker','compose'],
        },
      ],
    },
    {
      title: { fr: 'Semaine 4 — Kubernetes', en: 'Week 4 — Kubernetes' },
      lessons: [
        {
          kind: 'quiz',
          title: { fr: 'Quiz Kubernetes', en: 'Kubernetes Quiz' },
          durationMin: 12, deadLineInHours: 72, keyWords: ['Kubernetes'],
          sections: [{
            text: { fr: 'Kubernetes basics', en: 'Kubernetes basics' },
            questions: [
              {
                text: { fr: 'Quelle est l\'unité déployable la plus petite dans Kubernetes ?', en: 'Smallest deployable unit in Kubernetes?' },
                questionType: 'simple',
                options: [
                  wrong('Container', 'Container'),
                  correct('Pod', 'Pod'),
                  wrong('Node', 'Node'),
                  wrong('Deployment', 'Deployment'),
                ],
              },
              {
                text: { fr: 'Quel objet assure la haute dispo en répliquant des pods ?', en: 'Which object ensures HA by replicating pods?' },
                questionType: 'simple',
                options: [
                  wrong('Service', 'Service'),
                  correct('Deployment', 'Deployment'),
                  wrong('Ingress', 'Ingress'),
                  wrong('ConfigMap', 'ConfigMap'),
                ],
              },
              {
                text: { fr: 'Quel objet expose des pods derrière une IP stable ?', en: 'Which object exposes pods behind a stable IP?' },
                questionType: 'simple',
                options: [
                  correct('Service', 'Service'),
                  wrong('Deployment', 'Deployment'),
                  wrong('ReplicaSet', 'ReplicaSet'),
                  wrong('Volume', 'Volume'),
                ],
              },
              {
                text: { fr: 'Où stocker les secrets (mots de passe) ?', en: 'Where to store secrets (passwords)?' },
                questionType: 'simple',
                options: [
                  wrong('ConfigMap', 'ConfigMap'),
                  correct('Secret', 'Secret'),
                  wrong('Pod env directement', 'Pod env directly'),
                  wrong('Dans l\'image Docker', 'Inside the Docker image'),
                ],
              },
            ],
          }],
        },
      ],
    },
    {
      title: { fr: 'Semaine 5 — CI/CD', en: 'Week 5 — CI/CD' },
      lessons: [
        {
          kind: 'task',
          title: { fr: 'TP — Pipeline GitHub Actions', en: 'Lab — GitHub Actions pipeline' },
          description: {
            fr: 'Mettez en place un pipeline CI/CD GitHub Actions : lint, tests, build Docker, push sur GHCR, déploiement automatique en staging sur push, en prod sur tag. 4 jobs distincts.',
            en: 'Set up a GitHub Actions CI/CD pipeline: lint, tests, Docker build, GHCR push, auto staging deploy on push, prod deploy on tag. 4 distinct jobs.',
          },
          learningOutcome: 'Automatiser le delivery avec une CI moderne.',
          deadLineInHours: 120, keyWords: ['CI/CD','GitHub Actions'],
        },
      ],
    },
    {
      title: { fr: 'Semaine 6 — Projet final', en: 'Week 6 — Final project' },
      lessons: [
        {
          kind: 'task',
          title: { fr: 'Projet final — Cluster K8s complet', en: 'Final project — Full K8s cluster' },
          description: {
            fr: 'Déployez une app 3-tier (front, back, db) sur Kubernetes (Minikube ou GKE) avec Helm, Ingress, autoscaling et monitoring Prometheus + Grafana. Présentation du dashboard.',
            en: 'Deploy a 3-tier app (front, back, db) on Kubernetes (Minikube or GKE) with Helm, Ingress, autoscaling and Prometheus + Grafana monitoring. Dashboard presentation.',
          },
          learningOutcome: 'Maîtriser un cluster K8s complet.',
          deadLineInHours: 240, keyWords: ['K8s','Helm','monitoring'],
        },
      ],
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────
//   7. Cybersecurite Offensive (6 semaines)
// ──────────────────────────────────────────────────────────────────────
const TRAINING_CYBER: CatalogTraining = {
  title: { fr: 'Cybersécurité Offensive', en: 'Offensive Cybersecurity' },
  description: { fr: 'Du réseau à OWASP Top 10 et au pentest avec Burp Suite et Metasploit.', en: 'From networking to OWASP Top 10 and pentesting with Burp Suite and Metasploit.' },
  career: 'Analyste Cybersécurité', domain: 'Cybersécurité',
  priceTnd: 1800, priceEur: 580, durationWeeks: 6,
  weeks: [
    {
      title: { fr: 'Semaine 1 — Réseau', en: 'Week 1 — Networking' },
      lessons: [
        {
          kind: 'quiz',
          title: { fr: 'Quiz Réseau & Protocoles', en: 'Networking Quiz' },
          durationMin: 10, deadLineInHours: 48, keyWords: ['réseau'],
          sections: [{
            text: { fr: 'Protocoles fondamentaux', en: 'Core protocols' },
            questions: [
              {
                text: { fr: 'Sur quel port tourne HTTPS par défaut ?', en: 'Default HTTPS port?' },
                questionType: 'simple',
                options: [
                  wrong('80', '80'),
                  correct('443', '443'),
                  wrong('8080', '8080'),
                  wrong('22', '22'),
                ],
              },
              {
                text: { fr: 'Quel protocole transforme un nom de domaine en IP ?', en: 'Which protocol resolves a domain to an IP?' },
                questionType: 'simple',
                options: [
                  wrong('HTTP', 'HTTP'),
                  correct('DNS', 'DNS'),
                  wrong('SMTP', 'SMTP'),
                  wrong('TCP', 'TCP'),
                ],
              },
              {
                text: { fr: 'Quel protocole offre une connexion fiable et ordonnée ?', en: 'Reliable, ordered protocol?' },
                questionType: 'simple',
                options: [
                  wrong('UDP', 'UDP'),
                  correct('TCP', 'TCP'),
                  wrong('ICMP', 'ICMP'),
                  wrong('ARP', 'ARP'),
                ],
              },
            ],
          }],
        },
      ],
    },
    {
      title: { fr: 'Semaine 2 — Linux Security', en: 'Week 2 — Linux Security' },
      lessons: [
        {
          kind: 'task',
          title: { fr: 'TP — Hardening Linux', en: 'Lab — Linux Hardening' },
          description: {
            fr: 'Sur une VM Ubuntu : durcissez SSH (port custom, key-only), activez ufw, fail2ban, désactivez les services inutiles, mettez à jour le kernel, vérifiez avec Lynis. Livrable : rapport Lynis avant/après.',
            en: 'On an Ubuntu VM: harden SSH (custom port, key-only), enable ufw, fail2ban, disable unused services, update kernel, verify with Lynis. Deliverable: before/after Lynis report.',
          },
          learningOutcome: 'Durcir un système Linux selon les bonnes pratiques.',
          deadLineInHours: 96, keyWords: ['Linux','hardening'],
        },
      ],
    },
    {
      title: { fr: 'Semaine 3 — OWASP Top 10', en: 'Week 3 — OWASP Top 10' },
      lessons: [
        {
          kind: 'text',
          title: { fr: 'Les 10 vulnérabilités web les plus critiques', en: 'Top 10 critical web vulnerabilities' },
          keyWords: ['OWASP','sécurité web'],
          htmlContent: `
<h2>OWASP Top 10 (2021)</h2>
<ol>
  <li>Broken Access Control</li>
  <li>Cryptographic Failures</li>
  <li>Injection (SQL, NoSQL, command…)</li>
  <li>Insecure Design</li>
  <li>Security Misconfiguration</li>
  <li>Vulnerable Components</li>
  <li>Identification & Authentication Failures</li>
  <li>Software & Data Integrity Failures</li>
  <li>Security Logging & Monitoring Failures</li>
  <li>SSRF</li>
</ol>`,
        },
        {
          kind: 'quiz',
          title: { fr: 'Quiz OWASP', en: 'OWASP Quiz' },
          durationMin: 10, deadLineInHours: 48, keyWords: ['OWASP'],
          sections: [{
            text: { fr: 'OWASP Top 10', en: 'OWASP Top 10' },
            questions: [
              {
                text: { fr: 'Quelle attaque consiste à injecter du SQL dans un champ ?', en: 'Which attack injects SQL into a field?' },
                questionType: 'simple',
                options: [
                  wrong('XSS', 'XSS'),
                  correct('SQL Injection', 'SQL Injection'),
                  wrong('CSRF', 'CSRF'),
                  wrong('SSRF', 'SSRF'),
                ],
              },
              {
                text: { fr: 'Quelle protection prévient les injections SQL ?', en: 'What prevents SQL injections?' },
                questionType: 'simple',
                options: [
                  wrong('Échapper en HTML', 'HTML escape'),
                  correct('Prepared statements / paramétrage', 'Prepared statements / parameterization'),
                  wrong('CAPTCHA', 'CAPTCHA'),
                  wrong('CORS', 'CORS'),
                ],
              },
              {
                text: { fr: 'Que vise une attaque XSS ?', en: 'What does an XSS attack target?' },
                questionType: 'simple',
                options: [
                  wrong('La DB', 'The DB'),
                  correct('Le navigateur des utilisateurs', 'Users\' browsers'),
                  wrong('Le serveur DNS', 'DNS server'),
                  wrong('Le routeur', 'Router'),
                ],
              },
            ],
          }],
        },
      ],
    },
    {
      title: { fr: 'Semaine 4 — Pentest', en: 'Week 4 — Pentest' },
      lessons: [
        {
          kind: 'video',
          title: { fr: 'Burp Suite tutoriel', en: 'Burp Suite tutorial' },
          videoUrl: 'https://www.youtube.com/watch?v=GTfJYE3UJqo',
          keyWords: ['Burp Suite','pentest'],
        },
        {
          kind: 'task',
          title: { fr: 'TP — CTF Juice Shop', en: 'Lab — Juice Shop CTF' },
          description: {
            fr: 'Résolvez 15 challenges OWASP Juice Shop (niveau 1-2-3). Documentez chaque exploit (capture, payload, contre-mesure).',
            en: 'Solve 15 OWASP Juice Shop challenges (level 1-2-3). Document each exploit (screenshot, payload, mitigation).',
          },
          learningOutcome: 'Exploiter et documenter des vulnérabilités web.',
          deadLineInHours: 120, keyWords: ['CTF','Juice Shop','pentest'],
        },
      ],
    },
    {
      title: { fr: 'Semaine 5 — Cryptographie', en: 'Week 5 — Cryptography' },
      lessons: [
        {
          kind: 'text',
          title: { fr: 'Symétrique vs asymétrique', en: 'Symmetric vs asymmetric' },
          keyWords: ['crypto'],
          htmlContent: `
<h2>AES, RSA, ECDH</h2>
<p>Symétrique (AES) : 1 clé, rapide. Asymétrique (RSA, ECDH) : 2 clés (publique/privée), plus lent mais permet l'échange de clé. TLS combine les deux.</p>`,
        },
      ],
    },
    {
      title: { fr: 'Semaine 6 — Projet final', en: 'Week 6 — Final project' },
      lessons: [
        {
          kind: 'task',
          title: { fr: 'Projet final — Pentest report', en: 'Final project — Pentest report' },
          description: {
            fr: 'Réalisez un pentest sur une cible légale (HackTheBox, TryHackMe ou app personnelle). Livrable : rapport pro 20-30 pages avec executive summary, méthodologie, vulnérabilités, preuves, criticité CVSS, remédiation.',
            en: 'Conduct a pentest on a legal target (HackTheBox, TryHackMe or own app). Deliverable: pro report 20-30 pages with exec summary, methodology, vulns, evidence, CVSS criticality, remediation.',
          },
          learningOutcome: 'Livrer un rapport de pentest professionnel.',
          deadLineInHours: 240, keyWords: ['pentest','rapport'],
        },
      ],
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────
//   8. Developpement Mobile Flutter (6 semaines)
// ──────────────────────────────────────────────────────────────────────
const TRAINING_FLUTTER: CatalogTraining = {
  title: { fr: 'Développement Mobile Flutter', en: 'Mobile Development with Flutter' },
  description: { fr: 'Apps iOS + Android multiplateformes avec Flutter et Dart.', en: 'Cross-platform iOS + Android apps with Flutter and Dart.' },
  career: 'Développeur Mobile', domain: 'Développement',
  priceTnd: 1300, priceEur: 420, durationWeeks: 6,
  weeks: [
    {
      title: { fr: 'Semaine 1 — Dart', en: 'Week 1 — Dart' },
      lessons: [
        {
          kind: 'quiz',
          title: { fr: 'Quiz Dart', en: 'Dart Quiz' },
          durationMin: 10, deadLineInHours: 48, keyWords: ['Dart'],
          sections: [{
            text: { fr: 'Dart basics', en: 'Dart basics' },
            questions: [
              {
                text: { fr: 'Quel mot-clé déclare une constante en Dart ?', en: 'Which keyword declares a Dart constant?' },
                questionType: 'simple',
                options: [
                  wrong('let', 'let'),
                  correct('final ou const', 'final or const'),
                  wrong('val', 'val'),
                  wrong('static', 'static'),
                ],
              },
              {
                text: { fr: 'Comment déclare-t-on une variable nullable ?', en: 'How to declare a nullable variable?' },
                questionType: 'simple',
                options: [
                  wrong('String name;', 'String name;'),
                  correct('String? name;', 'String? name;'),
                  wrong('Nullable<String> name;', 'Nullable<String> name;'),
                  wrong('var name = null;', 'var name = null;'),
                ],
              },
            ],
          }],
        },
      ],
    },
    {
      title: { fr: 'Semaine 2 — Widgets', en: 'Week 2 — Widgets' },
      lessons: [
        {
          kind: 'text',
          title: { fr: 'StatelessWidget vs StatefulWidget', en: 'StatelessWidget vs StatefulWidget' },
          keyWords: ['Flutter','widgets'],
          htmlContent: `
<pre><code>class Counter extends StatefulWidget {
  @override
  State&lt;Counter&gt; createState() =&gt; _CounterState();
}

class _CounterState extends State&lt;Counter&gt; {
  int n = 0;
  @override
  Widget build(BuildContext ctx) =&gt; ElevatedButton(
    onPressed: () =&gt; setState(() =&gt; n++),
    child: Text('Clicked $n times'),
  );
}</code></pre>`,
        },
        {
          kind: 'task',
          title: { fr: 'TP — UI clone Instagram', en: 'Lab — Instagram UI clone' },
          description: {
            fr: 'Reproduisez 3 écrans Instagram : feed, profil, post détail. Widgets custom, bottom navigation, gestion des images réseau.',
            en: 'Reproduce 3 Instagram screens: feed, profile, post detail. Custom widgets, bottom navigation, network image handling.',
          },
          learningOutcome: 'Composer des UI complexes avec Flutter.',
          deadLineInHours: 96, keyWords: ['Flutter','UI'],
        },
      ],
    },
    {
      title: { fr: 'Semaine 3 — State management', en: 'Week 3 — State management' },
      lessons: [
        {
          kind: 'task',
          title: { fr: 'TP — Riverpod', en: 'Lab — Riverpod' },
          description: {
            fr: 'Refactorez votre UI Instagram avec Riverpod : providers, AsyncValue pour les API calls, AutoDispose. Tests sur les providers.',
            en: 'Refactor your Instagram UI with Riverpod: providers, AsyncValue for API calls, AutoDispose. Provider tests.',
          },
          learningOutcome: 'Maîtriser Riverpod en production.',
          deadLineInHours: 96, keyWords: ['Riverpod','state'],
        },
      ],
    },
    {
      title: { fr: 'Semaine 4 — Firebase', en: 'Week 4 — Firebase' },
      lessons: [
        {
          kind: 'task',
          title: { fr: 'TP — Auth + Firestore', en: 'Lab — Auth + Firestore' },
          description: {
            fr: 'Ajoutez l\'auth Email/Google et un Firestore (collection posts) à votre app Flutter. Règles de sécurité strictes.',
            en: 'Add Email/Google auth and Firestore (posts collection) to your Flutter app. Strict security rules.',
          },
          learningOutcome: 'Intégrer Firebase Auth + Firestore proprement.',
          deadLineInHours: 96, keyWords: ['Firebase'],
        },
      ],
    },
    {
      title: { fr: 'Semaine 5 — Déploiement', en: 'Week 5 — Deployment' },
      lessons: [
        {
          kind: 'doc',
          title: { fr: 'Publier sur App Store et Play Store', en: 'Publish to App Store and Play Store' },
          keyWords: ['publication','stores'],
          documents: [
            { title: { fr: 'Guide Play Store (PDF)' }, url: 'https://www.africau.edu/images/default/sample.pdf' },
            { title: { fr: 'Guide App Store (PDF)' }, url: 'https://www.w3.org/WAI/WCAG21/wcag21.pdf' },
          ],
        },
      ],
    },
    {
      title: { fr: 'Semaine 6 — Projet final', en: 'Week 6 — Final project' },
      lessons: [
        {
          kind: 'task',
          title: { fr: 'Projet final — App mobile complete', en: 'Final project — Complete mobile app' },
          description: {
            fr: 'Construisez une app Flutter complète (fitness, food delivery, social…) avec auth, persistance, notifications push, mode hors-ligne. Publication sur Play Store internal testing.',
            en: 'Build a complete Flutter app (fitness, food delivery, social…) with auth, persistence, push notifications, offline mode. Publish to Play Store internal testing.',
          },
          learningOutcome: 'Livrer une app mobile prête au store.',
          deadLineInHours: 240, keyWords: ['Flutter','prod'],
        },
      ],
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────
//   9. Cloud AWS (5 semaines)
// ──────────────────────────────────────────────────────────────────────
const TRAINING_AWS: CatalogTraining = {
  title: { fr: 'Cloud Computing AWS', en: 'AWS Cloud Computing' },
  description: { fr: 'Préparation à AWS Cloud Practitioner : EC2, S3, RDS, IAM, VPC.', en: 'AWS Cloud Practitioner prep: EC2, S3, RDS, IAM, VPC.' },
  career: 'Architecte Cloud', domain: 'Cloud & DevOps',
  priceTnd: 1200, priceEur: 380, durationWeeks: 5,
  weeks: [
    {
      title: { fr: 'Semaine 1 — IAM & VPC', en: 'Week 1 — IAM & VPC' },
      lessons: [
        {
          kind: 'quiz',
          title: { fr: 'Quiz IAM', en: 'IAM Quiz' },
          durationMin: 10, deadLineInHours: 48, keyWords: ['AWS','IAM'],
          sections: [{
            text: { fr: 'AWS IAM', en: 'AWS IAM' },
            questions: [
              {
                text: { fr: 'Quel principe IAM recommande de donner uniquement les permissions nécessaires ?', en: 'Which IAM principle says: give only required permissions?' },
                questionType: 'simple',
                options: [
                  wrong('Principle of trust', 'Principle of trust'),
                  correct('Principle of least privilege', 'Principle of least privilege'),
                  wrong('Principle of defense in depth', 'Defense in depth'),
                  wrong('Principle of separation', 'Separation principle'),
                ],
              },
              {
                text: { fr: 'Quelle ressource AWS isole un réseau privé ?', en: 'Which AWS resource isolates a private network?' },
                questionType: 'simple',
                options: [
                  wrong('S3', 'S3'),
                  wrong('IAM', 'IAM'),
                  correct('VPC', 'VPC'),
                  wrong('Route 53', 'Route 53'),
                ],
              },
              {
                text: { fr: 'Quel service AWS sert à exécuter du code serverless ?', en: 'Which AWS service runs serverless code?' },
                questionType: 'simple',
                options: [
                  wrong('EC2', 'EC2'),
                  correct('Lambda', 'Lambda'),
                  wrong('ECS', 'ECS'),
                  wrong('Beanstalk', 'Beanstalk'),
                ],
              },
            ],
          }],
        },
      ],
    },
    {
      title: { fr: 'Semaine 2 — EC2 & S3', en: 'Week 2 — EC2 & S3' },
      lessons: [
        {
          kind: 'task',
          title: { fr: 'TP — Site statique S3 + CloudFront', en: 'Lab — Static site S3 + CloudFront' },
          description: {
            fr: 'Hébergez un site statique sur S3 derrière CloudFront avec HTTPS via ACM. Configurez un Origin Access Identity.',
            en: 'Host a static site on S3 behind CloudFront with HTTPS via ACM. Configure Origin Access Identity.',
          },
          learningOutcome: 'Héberger une stack statique scalable sur AWS.',
          deadLineInHours: 72, keyWords: ['S3','CloudFront'],
        },
      ],
    },
    {
      title: { fr: 'Semaine 3 — RDS & Lambda', en: 'Week 3 — RDS & Lambda' },
      lessons: [
        {
          kind: 'task',
          title: { fr: 'TP — API serverless', en: 'Lab — Serverless API' },
          description: {
            fr: 'Construisez une API serverless : API Gateway + Lambda Node.js + RDS Aurora Serverless. Déploiement via SAM ou Serverless Framework.',
            en: 'Build a serverless API: API Gateway + Lambda Node.js + RDS Aurora Serverless. Deploy with SAM or Serverless Framework.',
          },
          learningOutcome: 'Concevoir une API serverless cost-optimisée.',
          deadLineInHours: 120, keyWords: ['Lambda','RDS','serverless'],
        },
      ],
    },
    {
      title: { fr: 'Semaine 4 — Monitoring & CloudWatch', en: 'Week 4 — Monitoring & CloudWatch' },
      lessons: [
        {
          kind: 'video',
          title: { fr: 'CloudWatch metrics & alarms', en: 'CloudWatch metrics & alarms' },
          videoUrl: 'https://www.youtube.com/watch?v=k7wuIrHU4UY',
          keyWords: ['CloudWatch'],
        },
      ],
    },
    {
      title: { fr: 'Semaine 5 — Projet final', en: 'Week 5 — Final project' },
      lessons: [
        {
          kind: 'task',
          title: { fr: 'Projet final — Architecture 3-tier AWS', en: 'Final project — 3-tier AWS architecture' },
          description: {
            fr: 'Concevez et déployez une architecture 3-tier complète : ALB → EC2 (Auto Scaling) → RDS Multi-AZ, en deux régions, avec backups, monitoring CloudWatch et IaC Terraform. Schéma + démo.',
            en: 'Design and deploy a complete 3-tier architecture: ALB → EC2 (Auto Scaling) → RDS Multi-AZ, in two regions, with backups, CloudWatch monitoring and Terraform IaC. Diagram + demo.',
          },
          learningOutcome: 'Architecturer une infra AWS résiliente.',
          deadLineInHours: 240, keyWords: ['AWS','Terraform','3-tier'],
        },
      ],
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────
//   10. Java & Spring Boot (6 semaines)
// ──────────────────────────────────────────────────────────────────────
const TRAINING_JAVA: CatalogTraining = {
  title: { fr: 'Java & Spring Boot', en: 'Java & Spring Boot' },
  description: { fr: 'Backend pro avec Spring Boot, JPA, Spring Security et tests.', en: 'Pro backend with Spring Boot, JPA, Spring Security and tests.' },
  career: 'Développeur Back-End', domain: 'Développement',
  priceTnd: 1300, priceEur: 420, durationWeeks: 6,
  weeks: [
    {
      title: { fr: 'Semaine 1 — Java moderne', en: 'Week 1 — Modern Java' },
      lessons: [
        {
          kind: 'text',
          title: { fr: 'Records, streams, Optional', en: 'Records, streams, Optional' },
          keyWords: ['Java'],
          htmlContent: `
<pre><code>record User(Long id, String name) {}

List&lt;String&gt; names = users.stream()
  .filter(u -&gt; u.id() &gt; 0)
  .map(User::name)
  .sorted()
  .toList();

Optional&lt;User&gt; u = repo.findById(1L);
u.ifPresent(System.out::println);</code></pre>`,
        },
        {
          kind: 'quiz',
          title: { fr: 'Quiz Java 17+', en: 'Java 17+ Quiz' },
          durationMin: 10, deadLineInHours: 48, keyWords: ['Java'],
          sections: [{
            text: { fr: 'Java moderne', en: 'Modern Java' },
            questions: [
              {
                text: { fr: 'Quel objet évite les NullPointerException ?', en: 'Which object avoids NullPointerExceptions?' },
                questionType: 'simple',
                options: [
                  wrong('Nullable<T>', 'Nullable<T>'),
                  correct('Optional<T>', 'Optional<T>'),
                  wrong('Maybe<T>', 'Maybe<T>'),
                  wrong('Either<T>', 'Either<T>'),
                ],
              },
              {
                text: { fr: 'Quel mot-clé Java déclare un type immutable concis ?', en: 'Which Java keyword declares a concise immutable type?' },
                questionType: 'simple',
                options: [
                  wrong('class', 'class'),
                  wrong('struct', 'struct'),
                  correct('record', 'record'),
                  wrong('immutable', 'immutable'),
                ],
              },
            ],
          }],
        },
      ],
    },
    {
      title: { fr: 'Semaine 2 — Spring Boot Basics', en: 'Week 2 — Spring Boot Basics' },
      lessons: [
        {
          kind: 'task',
          title: { fr: 'TP — REST API Spring Boot', en: 'Lab — Spring Boot REST API' },
          description: {
            fr: 'Construisez une API REST Spring Boot pour gérer des livres : CRUD complet, pagination, tri, validation Bean Validation, exception handler global.',
            en: 'Build a Spring Boot REST API to manage books: full CRUD, pagination, sorting, Bean Validation, global exception handler.',
          },
          learningOutcome: 'Maîtriser les controllers Spring Boot.',
          deadLineInHours: 96, keyWords: ['Spring Boot','REST'],
        },
      ],
    },
    {
      title: { fr: 'Semaine 3 — Spring Data JPA', en: 'Week 3 — Spring Data JPA' },
      lessons: [
        {
          kind: 'task',
          title: { fr: 'TP — Relations JPA', en: 'Lab — JPA relations' },
          description: {
            fr: 'Modélisez Auteur ⟷ Livre (1-N) et Livre ⟷ Tag (N-N) avec JPA. Requêtes JPQL et @Query. Tests avec H2 in-memory.',
            en: 'Model Author ⟷ Book (1-N) and Book ⟷ Tag (N-N) with JPA. JPQL queries and @Query. Tests with H2 in-memory.',
          },
          learningOutcome: 'Modéliser et requêter avec JPA.',
          deadLineInHours: 96, keyWords: ['JPA','Hibernate'],
        },
      ],
    },
    {
      title: { fr: 'Semaine 4 — Spring Security', en: 'Week 4 — Spring Security' },
      lessons: [
        {
          kind: 'task',
          title: { fr: 'TP — Auth JWT', en: 'Lab — JWT Auth' },
          description: {
            fr: 'Sécurisez votre API avec Spring Security + JWT : signup, login, /me, rôles ROLE_USER / ROLE_ADMIN. Tests Postman.',
            en: 'Secure your API with Spring Security + JWT: signup, login, /me, ROLE_USER / ROLE_ADMIN roles. Postman tests.',
          },
          learningOutcome: 'Sécuriser une API Spring avec JWT.',
          deadLineInHours: 120, keyWords: ['Spring Security','JWT'],
        },
      ],
    },
    {
      title: { fr: 'Semaine 5 — Tests', en: 'Week 5 — Tests' },
      lessons: [
        {
          kind: 'task',
          title: { fr: 'TP — Tests unitaires + integration', en: 'Lab — Unit + integration tests' },
          description: {
            fr: 'Écrivez des tests JUnit 5 + Mockito (services, contrôleurs avec MockMvc, repos avec Testcontainers Postgres). Coverage > 75%.',
            en: 'Write JUnit 5 + Mockito tests (services, controllers with MockMvc, repos with Testcontainers Postgres). Coverage > 75%.',
          },
          learningOutcome: 'Tester une app Spring proprement.',
          deadLineInHours: 96, keyWords: ['tests','JUnit','Testcontainers'],
        },
      ],
    },
    {
      title: { fr: 'Semaine 6 — Projet final', en: 'Week 6 — Final project' },
      lessons: [
        {
          kind: 'task',
          title: { fr: 'Projet final — API e-commerce', en: 'Final project — E-commerce API' },
          description: {
            fr: 'Construisez l\'API d\'un mini e-commerce Spring Boot : produits, panier, commande, paiement Stripe (mock), email confirmation. Documentation OpenAPI/Swagger.',
            en: 'Build a mini e-commerce Spring Boot API: products, cart, order, Stripe payment (mock), confirmation email. OpenAPI/Swagger docs.',
          },
          learningOutcome: 'Livrer une API métier complète.',
          deadLineInHours: 240, keyWords: ['Spring Boot','e-commerce'],
        },
      ],
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────
//   Catalogue exporté
// ──────────────────────────────────────────────────────────────────────
export const TRAINING_CATALOG: CatalogTraining[] = [
  TRAINING_FULLSTACK,
  TRAINING_REACT_TS,
  TRAINING_DATA_SCIENCE,
  TRAINING_UXUI,
  TRAINING_SEO,
  TRAINING_DEVOPS,
  TRAINING_CYBER,
  TRAINING_FLUTTER,
  TRAINING_AWS,
  TRAINING_JAVA,
];