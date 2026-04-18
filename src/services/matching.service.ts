import * as tf from '@tensorflow/tfjs';
import axios from 'axios';

export interface SkillVector {
  skill: string;
  level: number;
}

export interface MatchResult {
  candidateId:    string;
  score:          number; // 0-100
  matchedSkills:  string[];
  missingSkills:  string[];
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
  hardSkills: SkillVector[];
  softwares:  SkillVector[];
  softSkills: string[];
}

export interface CandidateSkills {
  id:         string;
  hardSkills: SkillVector[];
  softwares:  SkillVector[];
  softSkills: string[];
}

export const rankCandidates = (
  offer: JobOfferSkills,
  candidates: CandidateSkills[]
): MatchResult[] => {
  const allSkills = [
    ...new Set([
      ...offer.hardSkills.map(s => s.skill.toLowerCase()),
      ...offer.softwares.map(s => s.skill.toLowerCase()),
      ...offer.softSkills.map(s => s.toLowerCase()),
      ...candidates.flatMap(c => [
        ...c.hardSkills.map(s => s.skill.toLowerCase()),
        ...c.softwares.map(s => s.skill.toLowerCase()),
        ...c.softSkills.map(s => s.toLowerCase()),
      ]),
    ]),
  ];

  const offerHard    = buildVector(allSkills, offer.hardSkills);
  const offerSoft    = buildVector(allSkills, offer.softwares);
  const offerSoftSk  = buildVector(allSkills, offer.softSkills.map(s => ({ skill: s, level: 3 })));

  const results: MatchResult[] = candidates.map(candidate => {
    const candHard   = buildVector(allSkills, candidate.hardSkills);
    const candSoft   = buildVector(allSkills, candidate.softwares);
    const candSoftSk = buildVector(allSkills, candidate.softSkills.map(s => ({ skill: s, level: 3 })));

    const simHard  = cosineSimilarity(offerHard,   candHard);
    const simSoft  = cosineSimilarity(offerSoft,   candSoft);
    const simSoftSk= cosineSimilarity(offerSoftSk, candSoftSk);

    const score = Math.round(((simHard * 0.5) + (simSoft * 0.3) + (simSoftSk * 0.2)) * 100);

    const offerSkillNames = [
      ...offer.hardSkills.map(s => s.skill.toLowerCase()),
      ...offer.softwares.map(s => s.skill.toLowerCase()),
      ...offer.softSkills.map(s => s.toLowerCase()),
    ];
    const candSkillNames = [
      ...candidate.hardSkills.map(s => s.skill.toLowerCase()),
      ...candidate.softwares.map(s => s.skill.toLowerCase()),
      ...candidate.softSkills.map(s => s.toLowerCase()),
    ];

    const matchedSkills = offerSkillNames.filter(s => candSkillNames.includes(s));
    const missingSkills = offerSkillNames.filter(s => !candSkillNames.includes(s));

    [offerHard, offerSoft, offerSoftSk, candHard, candSoft, candSoftSk].forEach(t => t.dispose());

    return { candidateId: candidate.id, score, matchedSkills, missingSkills };
  });

  return results.sort((a, b) => b.score - a.score);
};

export const rankWithPython = async (
  offer: JobOfferSkills,
  candidates: CandidateSkills[]
): Promise<MatchResult[]> => {
  try {
    const { data } = await axios.post(`${process.env.PYTHON_SERVICE_URL}/match`, { offer, candidates });
    return data.results;
  } catch {
    // fallback to TF.js if Python service is down
    return rankCandidates(offer, candidates);
  }
};
