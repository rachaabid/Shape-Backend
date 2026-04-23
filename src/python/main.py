"""
Shape AI Matching Service
Score final = 60 % similarité sémantique (embeddings CV ↔ offre)
            + 40 % matching compétences (vecteurs PyTorch)

Si le CV est absent → 100 % compétences (dégradé gracieux)
"""

from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
import torch
import torch.nn.functional as F
import uvicorn, requests, io, re

import pdfplumber
from sentence_transformers import SentenceTransformer, util as sbert_util

app = FastAPI(title="Shape AI Matching Service")

# ── Multilingual sentence model (FR / EN / AR) ───────────────
_sbert: Optional[SentenceTransformer] = None

def get_sbert() -> SentenceTransformer:
    global _sbert
    if _sbert is None:
        _sbert = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
    return _sbert


# ── Common tech/soft skills for CV extraction ─────────────────
TECH_KEYWORDS = [
    "python","java","javascript","typescript","c++","c#","go","rust","kotlin","swift",
    "react","angular","vue","nextjs","nuxtjs","flutter","django","fastapi","spring",
    "nodejs","express","laravel","symfony",
    "sql","mysql","postgresql","mongodb","redis","elasticsearch","firebase",
    "docker","kubernetes","git","github","gitlab","jenkins","ci/cd","linux","bash",
    "aws","azure","gcp","terraform","ansible",
    "figma","photoshop","illustrator","xd","sketch","canva",
    "tensorflow","pytorch","sklearn","pandas","numpy","opencv",
    "agile","scrum","kanban","jira","confluence","trello",
    "rest","graphql","microservices","api","oauth","jwt",
    "html","css","sass","tailwind","bootstrap","webpack","vite",
    # soft skills
    "communication","leadership","teamwork","autonomie","créativité","adaptabilité",
    "organisation","rigueur","esprit critique","gestion de projet","résolution de problèmes",
]


# ── Schemas ───────────────────────────────────────────────────

class SkillVector(BaseModel):
    skill: str
    level: float  # 0–5

class JobOfferSkills(BaseModel):
    hardSkills:  List[SkillVector] = []
    softwares:   List[SkillVector] = []
    softSkills:  List[str] = []
    description: Optional[str] = None  # title + description + requiredProfile

class CandidateSkills(BaseModel):
    id:         str
    hardSkills: List[SkillVector] = []
    softwares:  List[SkillVector] = []
    softSkills: List[str] = []
    cvUrl:      Optional[str] = None

class MatchRequest(BaseModel):
    offer:      JobOfferSkills
    candidates: List[CandidateSkills]

class MatchResult(BaseModel):
    candidateId:       str
    score:             int          # 0-100 final weighted score
    skillScore:        float        # 0-1  pure skills component
    semanticScore:     float        # 0-1  CV semantic component (0 if no CV)
    matchedSkills:     List[str]
    missingSkills:     List[str]
    extractedCvSkills: List[str]    # skills detected automatically in CV text

class MatchResponse(BaseModel):
    results: List[MatchResult]


# ── Skill-vector helpers ──────────────────────────────────────

def collect_all_skills(offer: JobOfferSkills, candidates: List[CandidateSkills]) -> List[str]:
    skills: set = set()
    for s in offer.hardSkills + offer.softwares:
        skills.add(s.skill.lower())
    for s in offer.softSkills:
        skills.add(s.lower())
    for c in candidates:
        for s in c.hardSkills + c.softwares:
            skills.add(s.skill.lower())
        for s in c.softSkills:
            skills.add(s.lower())
    return sorted(skills)


def build_vector(
    all_skills: List[str],
    hard: List[SkillVector],
    soft: List[SkillVector],
    soft_sk: List[str],
) -> torch.Tensor:
    vec = torch.zeros(len(all_skills))
    for s in hard + soft:
        key = s.skill.lower()
        if key in all_skills:
            vec[all_skills.index(key)] = s.level / 5.0
    for s in soft_sk:
        key = s.lower()
        if key in all_skills:
            idx = all_skills.index(key)
            vec[idx] = max(vec[idx].item(), 0.5)  # soft skills get at least 0.5
    return vec


def cosine_sim(a: torch.Tensor, b: torch.Tensor) -> float:
    if a.norm() == 0 or b.norm() == 0:
        return 0.0
    return float(F.cosine_similarity(a.unsqueeze(0), b.unsqueeze(0)).item())


# ── CV helpers ────────────────────────────────────────────────

def extract_cv_text(cv_url: str) -> str:
    """Download PDF and extract text from first 5 pages."""
    try:
        resp = requests.get(cv_url, timeout=15)
        resp.raise_for_status()
        with pdfplumber.open(io.BytesIO(resp.content)) as pdf:
            pages = [page.extract_text() or "" for page in pdf.pages[:5]]
            return " ".join(pages).strip()
    except Exception:
        return ""


def extract_skills_from_cv(cv_text: str, offer_skill_names: List[str]) -> List[str]:
    """
    Detect skills in CV text:
    1. All skills required by the offer that appear in the CV
    2. Common tech/soft keywords not already in offer
    """
    text_lower = cv_text.lower()
    found: set = set()

    # Skills required by the offer found in the CV
    for skill in offer_skill_names:
        if re.search(r'\b' + re.escape(skill.lower()) + r'\b', text_lower):
            found.add(skill.lower())

    # Common tech keywords
    for kw in TECH_KEYWORDS:
        if re.search(r'\b' + re.escape(kw.lower()) + r'\b', text_lower):
            found.add(kw.lower())

    return sorted(found)


def semantic_similarity(text_a: str, text_b: str) -> float:
    """Cosine similarity between two texts using multilingual sentence embeddings."""
    if not text_a.strip() or not text_b.strip():
        return 0.0
    model = get_sbert()
    emb_a = model.encode(text_a[:2000], convert_to_tensor=True)
    emb_b = model.encode(text_b[:2000], convert_to_tensor=True)
    return float(sbert_util.cos_sim(emb_a, emb_b).item())


# ── Main endpoint ─────────────────────────────────────────────

@app.post("/match", response_model=MatchResponse)
def match_candidates(req: MatchRequest) -> MatchResponse:
    all_skills = collect_all_skills(req.offer, req.candidates)

    offer_vec = build_vector(
        all_skills,
        req.offer.hardSkills,
        req.offer.softwares,
        req.offer.softSkills,
    )

    offer_skill_names = (
        [s.skill.lower() for s in req.offer.hardSkills]
        + [s.skill.lower() for s in req.offer.softwares]
        + [s.lower() for s in req.offer.softSkills]
    )

    offer_text = (req.offer.description or "").strip()

    results: List[MatchResult] = []

    for candidate in req.candidates:
        # ── 1. Skills score (TF / PyTorch cosine) ────────────
        cand_vec   = build_vector(all_skills, candidate.hardSkills, candidate.softwares, candidate.softSkills)
        skill_score = cosine_sim(offer_vec, cand_vec)

        cand_skill_names = (
            [s.skill.lower() for s in candidate.hardSkills]
            + [s.skill.lower() for s in candidate.softwares]
            + [s.lower() for s in candidate.softSkills]
        )
        matched = [s for s in offer_skill_names if s in cand_skill_names]
        missing = [s for s in offer_skill_names if s not in cand_skill_names]

        # ── 2. CV semantic score (sentence embeddings) ────────
        semantic_score     = 0.0
        extracted_cv_skills: List[str] = []
        has_cv = bool(candidate.cvUrl and offer_text)

        if has_cv:
            cv_text = extract_cv_text(candidate.cvUrl)   # type: ignore[arg-type]
            if cv_text:
                semantic_score      = semantic_similarity(cv_text, offer_text)
                extracted_cv_skills = extract_skills_from_cv(cv_text, offer_skill_names)

                # Skills found in CV but not declared → add to matched if in offer
                for sk in extracted_cv_skills:
                    if sk in offer_skill_names and sk not in matched:
                        matched.append(sk)
                    if sk in missing:
                        missing.remove(sk)

        # ── 3. Final score ────────────────────────────────────
        # With CV  → 60 % semantic + 40 % skills
        # Without  → 100 % skills (graceful degradation)
        if has_cv and semantic_score > 0:
            raw = skill_score * 0.4 + semantic_score * 0.6
        else:
            raw = skill_score

        score = max(0, min(100, int(round(raw * 100))))

        results.append(MatchResult(
            candidateId=candidate.id,
            score=score,
            skillScore=round(skill_score, 3),
            semanticScore=round(semantic_score, 3),
            matchedSkills=matched,
            missingSkills=missing,
            extractedCvSkills=extracted_cv_skills,
        ))

    results.sort(key=lambda r: r.score, reverse=True)
    return MatchResponse(results=results)


@app.get("/health")
def health():
    return {"status": "ok", "service": "Shape AI Matching"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
