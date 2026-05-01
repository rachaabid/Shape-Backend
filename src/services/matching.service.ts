import * as tf from '@tensorflow/tfjs';
import axios from 'axios';

const SKILL_KEYWORDS = [
  // tech
  'javascript','typescript','python','java','c#','c++','go','php','ruby','swift','kotlin',
  'react','angular','vue','nextjs','nodejs','express','django','fastapi','spring','laravel',
  'sql','mysql','postgresql','mongodb','redis','firebase','elasticsearch',
  'docker','kubernetes','git','linux','bash','aws','azure','gcp','terraform',
  'html','css','sass','tailwind','bootstrap','figma','photoshop','illustrator','canva',
  'tensorflow','pytorch','sklearn','pandas','numpy','opencv','machine learning','deep learning',
  'rest','graphql','api','microservices','agile','scrum','jira',
  // digital marketing / SEO
  'seo','sem','google analytics','google ads','meta ads','community management',
  'social media','réseaux sociaux','content','marketing digital','growth hacking',
  'emailing','copywriting','inbound marketing','wordpress','shopify','hubspot',
  // soft skills FR/EN
  'communication','leadership','teamwork','travail en équipe','autonomie','créativité',
  'adaptabilité','organisation','rigueur','esprit critique','gestion de projet',
  'management','analyse','analytique','data','design','stratégie','négociation',
];

const extractKeywordsFromText = (text: string): string[] => {
  if (!text) return [];
  const lower = text.toLowerCase();
  return SKILL_KEYWORDS.filter(kw => lower.includes(kw));
};

export interface SkillVector {
  skill: string;
  level: number;
}

export interface MatchResult {
  candidateId:        string;
  score:              number;  // 0-100 final weighted score
  skillScore?:        number;  // 0-1  skills component
  semanticScore?:     number;  // 0-1  CV semantic component
  matchedSkills:      string[];
  missingSkills:      string[];
  extractedCvSkills?: string[];
}

const cosineSimilarity = (a: tf.Tensor1D, b: tf.Tensor1D): number => {
  return tf.tidy(() => {
    const dot   = a.dot(b);
    const normA = a.norm();
    const normB = b.norm();
    const sim   = dot.div(normA.mul(normB).add(1e-8));
    return sim.dataSync()[0];
  });
};

const buildVector = (allSkills: string[], skills: SkillVector[]): tf.Tensor1D => {
  const vec = new Float32Array(allSkills.length);
  for (const { skill, level } of skills) {
    const idx = allSkills.indexOf(skill.toLowerCase());
    if (idx !== -1) vec[idx] = level / 5; // normalize 0-5 → 0-1
  }
  return tf.tensor1d(vec);
};

export interface JobOfferSkills {
  hardSkills:  SkillVector[];
  softwares:   SkillVector[];
  softSkills:  string[];
  description?: string; // combined offer text for CV semantic comparison
}

export interface CandidateSkills {
  id:         string;
  hardSkills: SkillVector[];
  softwares:  SkillVector[];
  softSkills: string[];
  cvUrl?:     string; // URL of candidate's CV PDF
}

export const rankCandidates = (
  offer: JobOfferSkills,
  candidates: CandidateSkills[]
): MatchResult[] => {
  const descKeywordsForIndex = extractKeywordsFromText(offer.description || '');

  const allSkills = [
    ...new Set([
      ...offer.hardSkills.map(s => s.skill.toLowerCase()),
      ...offer.softwares.map(s => s.skill.toLowerCase()),
      ...offer.softSkills.map(s => s.toLowerCase()),
      ...descKeywordsForIndex,
      ...candidates.flatMap(c => [
        ...c.hardSkills.map(s => s.skill.toLowerCase()),
        ...c.softwares.map(s => s.skill.toLowerCase()),
        ...c.softSkills.map(s => s.toLowerCase()),
      ]),
    ]),
  ];

  // When offer has no structured skills, extract from description text
  const descKeywords = extractKeywordsFromText(offer.description || '');
  let effectiveHardSkills = offer.hardSkills;
  let effectiveSoftwareSkills = offer.softwares;
  if (effectiveHardSkills.length === 0 && effectiveSoftwareSkills.length === 0 && descKeywords.length > 0) {
    effectiveHardSkills = descKeywords.map(s => ({ skill: s, level: 3 }));
  }
  const effectiveSoftSkills = [...new Set([...offer.softSkills, ...descKeywords])];

  const offerHard    = buildVector(allSkills, effectiveHardSkills);
  const offerSoft    = buildVector(allSkills, effectiveSoftwareSkills);
  const offerSoftSk  = buildVector(allSkills, effectiveSoftSkills.map(s => ({ skill: s, level: 3 })));

  const offerSkillNames = [
    ...effectiveHardSkills.map(s => s.skill.toLowerCase()),
    ...effectiveSoftwareSkills.map(s => s.skill.toLowerCase()),
    ...effectiveSoftSkills.map(s => s.toLowerCase()),
  ];

  const results: MatchResult[] = candidates.map(candidate => {
    const candHard   = buildVector(allSkills, candidate.hardSkills);
    const candSoft   = buildVector(allSkills, candidate.softwares);
    const candSoftSk = buildVector(allSkills, candidate.softSkills.map(s => ({ skill: s, level: 3 })));

    const simHard   = cosineSimilarity(offerHard,   candHard);
    const simSoft   = cosineSimilarity(offerSoft,   candSoft);
    const simSoftSk = cosineSimilarity(offerSoftSk, candSoftSk);

    const score = Math.round(((simHard * 0.5) + (simSoft * 0.3) + (simSoftSk * 0.2)) * 100);

    const candSkillNames = [
      ...candidate.hardSkills.map(s => s.skill.toLowerCase()),
      ...candidate.softwares.map(s => s.skill.toLowerCase()),
      ...candidate.softSkills.map(s => s.toLowerCase()),
    ];

    const matchedSkills = offerSkillNames.filter(s => candSkillNames.includes(s));
    const missingSkills = offerSkillNames.filter(s => !candSkillNames.includes(s));

    // Dispose only candidate tensors — offer tensors are reused across iterations
    [candHard, candSoft, candSoftSk].forEach(t => t.dispose());

    return { candidateId: candidate.id, score, matchedSkills, missingSkills };
  });

  // Dispose offer tensors once, after all candidates are processed
  [offerHard, offerSoft, offerSoftSk].forEach(t => t.dispose());

  return results.sort((a, b) => b.score - a.score);
};

export const rankWithPython = async (
  offer: JobOfferSkills,
  candidates: CandidateSkills[]
): Promise<MatchResult[]> => {
  try {
    const { data } = await axios.post(`${process.env.PYTHON_SERVICE_URL}/match`, { offer, candidates });
    return data.results;
  } catch (err) {
  console.error("Python service failed", err)
  throw err
}
};
