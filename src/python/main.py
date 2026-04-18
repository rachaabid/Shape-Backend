from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
import torch
import torch.nn.functional as F
import uvicorn

app = FastAPI(title="Shape AI Matching Service")


# ── Schemas ──────────────────────────────────────────────────

class SkillVector(BaseModel):
    skill: str
    level: float  # 0-5

class JobOfferSkills(BaseModel):
    hardSkills: List[SkillVector] = []
    softwares:  List[SkillVector] = []
    softSkills: List[str] = []

class CandidateSkills(BaseModel):
    id:         str
    hardSkills: List[SkillVector] = []
    softwares:  List[SkillVector] = []
    softSkills: List[str] = []

class MatchRequest(BaseModel):
    offer:      JobOfferSkills
    candidates: List[CandidateSkills]

class MatchResult(BaseModel):
    candidateId:   str
    score:         int
    matchedSkills: List[str]
    missingSkills: List[str]

class MatchResponse(BaseModel):
    results: List[MatchResult]


# ── Helpers ───────────────────────────────────────────────────

def collect_all_skills(offer: JobOfferSkills, candidates: List[CandidateSkills]) -> List[str]:
    skills = set()
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


def build_vector(all_skills: List[str], hard: List[SkillVector], soft: List[SkillVector], soft_sk: List[str]) -> torch.Tensor:
    vec = torch.zeros(len(all_skills))
    for s in hard + soft:
        idx = all_skills.index(s.skill.lower()) if s.skill.lower() in all_skills else -1
        if idx >= 0:
            vec[idx] = s.level / 5.0
    for s in soft_sk:
        idx = all_skills.index(s.lower()) if s.lower() in all_skills else -1
        if idx >= 0:
            vec[idx] = max(vec[idx].item(), 0.5)
    return vec


def cosine_sim(a: torch.Tensor, b: torch.Tensor) -> float:
    if a.norm() == 0 or b.norm() == 0:
        return 0.0
    return F.cosine_similarity(a.unsqueeze(0), b.unsqueeze(0)).item()


# ── Endpoint ─────────────────────────────────────────────────

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

    results: List[MatchResult] = []

    for candidate in req.candidates:
        cand_vec = build_vector(
            all_skills,
            candidate.hardSkills,
            candidate.softwares,
            candidate.softSkills,
        )

        similarity = cosine_sim(offer_vec, cand_vec)
        score = int(round(similarity * 100))

        cand_skill_names = (
            [s.skill.lower() for s in candidate.hardSkills]
            + [s.skill.lower() for s in candidate.softwares]
            + [s.lower() for s in candidate.softSkills]
        )

        matched = [s for s in offer_skill_names if s in cand_skill_names]
        missing = [s for s in offer_skill_names if s not in cand_skill_names]

        results.append(MatchResult(
            candidateId=candidate.id,
            score=score,
            matchedSkills=matched,
            missingSkills=missing,
        ))

    results.sort(key=lambda r: r.score, reverse=True)
    return MatchResponse(results=results)


@app.get("/health")
def health():
    return {"status": "ok", "service": "Shape AI Matching"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
