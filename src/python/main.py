"""
Shape AI Matching Service

Score = coverage(candidate skills / offer skills requirements)
      + optional 60% semantic boost when CV available
"""

import unicodedata
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import uvicorn, requests, io, re
import pdfplumber

try:
    from sentence_transformers import SentenceTransformer
    _sbert = None
    SBERT_AVAILABLE = True
except:
    SBERT_AVAILABLE = False

app = FastAPI(title="Shape AI Matching Service")

def get_sbert():
    global _sbert
    if not SBERT_AVAILABLE:
        return None
    if _sbert is None:
        _sbert = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
    return _sbert


# ─────────────────────────────────────────────
# ACCENT NORMALIZATION (critical for French)
# ─────────────────────────────────────────────
def remove_accents(s: str) -> str:
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')


# ─────────────────────────────────────────────
# KEYWORDS
# ─────────────────────────────────────────────
TECH_KEYWORDS = [
    # Digital marketing / SEO
    "seo", "sem", "google ads", "google analytics", "google search console",
    "community management", "social media", "social media marketing",
    "marketing digital", "growth hacking", "copywriting", "emailing", "email marketing",
    "content marketing", "inbound marketing", "affiliation", "a b testing", "analytics",
    "strategie digitale", "gestion de campagnes", "gestion de marque",
    "marketing influence", "e-commerce", "conversion", "cro",
    "semrush", "ahrefs", "mailchimp", "hubspot", "klaviyo", "hootsuite",
    "buffer", "meta business suite", "salesforce", "wordpress", "shopify",
    "canva", "adobe photoshop", "adobe illustrator", "adobe premiere pro",
    "capcut", "notion", "google ads editor",
    # Tech
    "python", "java", "javascript", "typescript", "go", "rust", "kotlin", "swift",
    "react", "angular", "vue", "nextjs", "nuxtjs", "flutter", "django", "fastapi", "spring",
    "nodejs", "express", "laravel", "symfony",
    "sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch", "firebase",
    "docker", "kubernetes", "git", "github", "gitlab", "jenkins", "ci cd", "linux", "bash",
    "aws", "azure", "gcp", "terraform", "ansible",
    "figma", "photoshop", "illustrator",
    "tensorflow", "pytorch", "sklearn", "pandas", "numpy", "opencv",
    "agile", "scrum", "kanban", "jira", "confluence", "trello",
    "rest", "graphql", "microservices", "api", "oauth", "jwt",
    "html", "css", "sass", "tailwind", "bootstrap", "webpack", "vite",
    # Soft skills
    "communication", "leadership", "teamwork", "travail en equipe",
    "autonomie", "creativite", "adaptabilite", "organisation", "rigueur",
    "esprit critique", "gestion de projet", "resolution de problemes",
    "analyse", "curiosite", "precision", "innovation", "polyvalence",
]

# Accent-free versions of all keywords (pre-computed once)
_KEYWORDS_CLEAN = [remove_accents(k) for k in TECH_KEYWORDS]

SYNONYMS = {
    "seo": ["seo", "referencement naturel", "referencement", "search engine optimization"],
    "sem": ["sem", "search engine marketing", "google ads", "google adwords"],
    "google analytics": ["google analytics", "ga4", "analytics"],
    "social media": ["social media", "reseaux sociaux", "community management"],
    "marketing digital": ["marketing digital", "digital marketing", "marketing en ligne"],
    "javascript": ["javascript", "js"],
    "nodejs": ["nodejs", "node js"],
    "react": ["react", "reactjs", "react js"],
    "angular": ["angular", "angularjs"],
    "python": ["python", "py"],
    "sql": ["sql", "mysql", "postgresql", "postgres"],
    "mongodb": ["mongodb", "mongo"],
    "aws": ["aws", "amazon web services"],
    "docker": ["docker", "conteneurisation", "containerization"],
    "git": ["git", "github", "gitlab"],
    "agile": ["agile", "scrum", "kanban", "methodologie agile"],
    "communication": ["communication"],
    "teamwork": ["teamwork", "travail en equipe", "esprit equipe"],
    "wordpress": ["wordpress"],
    "shopify": ["shopify"],
    "hubspot": ["hubspot"],
    "canva": ["canva"],
}

# Pre-compute accent-free synonym variants
_SYNONYMS_CLEAN = {main: [remove_accents(v) for v in variants] for main, variants in SYNONYMS.items()}


# ─────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────
class SkillVector(BaseModel):
    skill: str
    level: float

class JobOfferSkills(BaseModel):
    hardSkills: List[SkillVector] = []
    softwares: List[SkillVector] = []
    softSkills: List[str] = []
    description: Optional[str] = None

class CandidateSkills(BaseModel):
    id: str
    hardSkills: List[SkillVector] = []
    softwares: List[SkillVector] = []
    softSkills: List[str] = []
    cvUrl: Optional[str] = None

class MatchRequest(BaseModel):
    offer: JobOfferSkills
    candidates: List[CandidateSkills]

class MatchResult(BaseModel):
    candidateId: str
    score: int
    skillScore: float
    semanticScore: float
    matchedSkills: List[str]
    missingSkills: List[str]
    extractedCvSkills: List[str]

class MatchResponse(BaseModel):
    results: List[MatchResult]


# ─────────────────────────────────────────────
# NORMALIZATION
# ─────────────────────────────────────────────
def normalize_skill(skill: str) -> List[str]:
    """Map a compound skill name to one or more canonical keywords."""
    clean = remove_accents(skill.lower().strip())
    clean = re.sub(r'[^a-z0-9 ]', ' ', clean)
    clean = re.sub(r'\s+', ' ', clean).strip()

    found = []

    # Check synonyms first (using pre-computed accent-free variants)
    for main, variants in _SYNONYMS_CLEAN.items():
        for v in variants:
            if re.search(r'\b' + re.escape(v) + r'\b', clean):
                found.append(main)
                break

    # Fall back to TECH_KEYWORDS (using pre-computed accent-free versions)
    if not found:
        for kw_clean in _KEYWORDS_CLEAN:
            if re.search(r'\b' + re.escape(kw_clean) + r'\b', clean):
                found.append(kw_clean)

    return found if found else [clean]


# ─────────────────────────────────────────────
# VECTOR BUILD
# ─────────────────────────────────────────────
def build_vector(all_skills: list, skill_items: list, skill_index: dict, default_level: float = 0.6) -> np.ndarray:
    """Build skill vector. skill_items can be SkillVector objects or plain strings."""
    vec = np.zeros(len(all_skills))
    for s in skill_items:
        if isinstance(s, str):
            keys = normalize_skill(s)
            lvl = default_level
        else:
            keys = normalize_skill(s.skill)
            lvl = s.level / 5.0
        for k in keys:
            if k in skill_index:
                vec[skill_index[k]] = max(vec[skill_index[k]], lvl)
    return vec


def coverage_score(offer_vec: np.ndarray, cand_vec: np.ndarray) -> float:
    """What fraction of the offer's skill requirements does the candidate cover?

    Unlike cosine similarity, this does NOT penalize candidates for having extra skills.
    A candidate with all required skills + bonus skills still scores 1.0.
    """
    total = np.sum(offer_vec)
    if total == 0:
        return 0.0
    return float(np.sum(np.minimum(cand_vec, offer_vec)) / total)


def cosine_sim(a, b):
    if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
        return 0.0
    return float(cosine_similarity([a], [b])[0][0])


# ─────────────────────────────────────────────
# CV EXTRACTION
# ─────────────────────────────────────────────
def extract_cv_text(url):
    try:
        r = requests.get(url, timeout=10)
        r.raise_for_status()
        with pdfplumber.open(io.BytesIO(r.content)) as pdf:
            return " ".join([p.extract_text() or "" for p in pdf.pages[:5]])
    except:
        return ""


def semantic_similarity(a, b):
    model = get_sbert()
    if not model or not a.strip() or not b.strip():
        return 0.0
    emb_a = np.array(model.encode(a[:2000]))
    emb_b = np.array(model.encode(b[:2000]))
    return cosine_sim(emb_a, emb_b)


# ─────────────────────────────────────────────
# API
# ─────────────────────────────────────────────
def extract_skills_from_text(text: str):
    """Extract skill keywords from free text (offer description fallback)."""
    text_clean = remove_accents(text.lower())
    hard, soft_skills = [], []
    soft_kw = {"communication", "leadership", "teamwork", "travail en equipe",
               "autonomie", "creativite", "adaptabilite", "organisation", "rigueur",
               "esprit critique", "gestion de projet", "resolution de problemes",
               "analyse", "curiosite", "precision", "innovation", "polyvalence"}
    for kw_clean, kw_orig in zip(_KEYWORDS_CLEAN, TECH_KEYWORDS):
        if re.search(r'\b' + re.escape(kw_clean) + r'\b', text_clean):
            if kw_clean in soft_kw:
                soft_skills.append(kw_orig)
            else:
                hard.append({"skill": kw_orig, "level": 3})
    return hard, soft_skills


@app.post("/match", response_model=MatchResponse)
def match(req: MatchRequest):
    offer_text = (req.offer.description or "").strip()

    # When offer has no structured skills, extract them from description text
    if not req.offer.hardSkills and not req.offer.softwares and offer_text:
        hard, soft_sk = extract_skills_from_text(offer_text)
        req.offer.hardSkills = [SkillVector(**s) for s in hard]
        if not req.offer.softSkills:
            req.offer.softSkills = soft_sk
        print(f"[match] extracted from description: {[s.skill for s in req.offer.hardSkills]}")

    # Build global skill list from offer + all candidates
    all_skills_set = set()
    for s in req.offer.hardSkills + req.offer.softwares:
        all_skills_set.update(normalize_skill(s.skill))
    for s in req.offer.softSkills:
        all_skills_set.update(normalize_skill(s))
    for c in req.candidates:
        for s in c.hardSkills + c.softwares:
            all_skills_set.update(normalize_skill(s.skill))
        for s in c.softSkills:
            all_skills_set.update(normalize_skill(s))

    all_skills = list(all_skills_set)
    skill_index = {s: i for i, s in enumerate(all_skills)}

    print(f"[match] offer skills: {[s.skill for s in req.offer.hardSkills + req.offer.softwares]}")
    print(f"[match] candidates: {len(req.candidates)}")

    # Offer vector: hardSkills + softwares (80%) + softSkills (20%)
    offer_hard_vec = build_vector(all_skills, req.offer.hardSkills + req.offer.softwares, skill_index)
    offer_soft_vec = build_vector(all_skills, req.offer.softSkills, skill_index)
    offer_combined = 0.8 * offer_hard_vec + 0.2 * offer_soft_vec

    offer_names_set = set()
    for s in req.offer.hardSkills + req.offer.softwares:
        offer_names_set.update(normalize_skill(s.skill))
    for s in req.offer.softSkills:
        offer_names_set.update(normalize_skill(s))

    results = []

    for c in req.candidates:
        cand_hard_vec = build_vector(all_skills, c.hardSkills + c.softwares, skill_index)
        cand_soft_vec = build_vector(all_skills, c.softSkills, skill_index)
        cand_combined = 0.8 * cand_hard_vec + 0.2 * cand_soft_vec

        skill_score = coverage_score(offer_combined, cand_combined)

        cand_names = set()
        for s in c.hardSkills + c.softwares:
            cand_names.update(normalize_skill(s.skill))
        for s in c.softSkills:
            cand_names.update(normalize_skill(s))

        matched = list(offer_names_set & cand_names)
        missing = list(offer_names_set - cand_names)

        semantic_score = 0.0
        if c.cvUrl and offer_text:
            cv_text = extract_cv_text(c.cvUrl)
            if cv_text.strip():
                semantic_score = semantic_similarity(cv_text, offer_text)

        if semantic_score > 0:
            final = 0.4 * skill_score + 0.6 * semantic_score
        else:
            final = skill_score

        score = int(max(0, min(100, round(final * 100))))

        print(f"  {c.id[-6:]} score={score} skill={skill_score:.2f} sem={semantic_score:.2f} matched={matched[:3]}")

        results.append(MatchResult(
            candidateId=c.id,
            score=score,
            skillScore=round(skill_score, 3),
            semanticScore=round(semantic_score, 3),
            matchedSkills=matched,
            missingSkills=missing,
            extractedCvSkills=[]
        ))

    results.sort(key=lambda x: x.score, reverse=True)
    print(f"[match] top scores: {[(r.candidateId[-4:], r.score) for r in results[:5]]}")
    return MatchResponse(results=results)


@app.get("/health")
def health():
    return {"ok": True, "sbert": SBERT_AVAILABLE}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
