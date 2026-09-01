from typing import Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.api.deps import SessionDep, CurrentUser
from app.services.llm import get_llm_provider

router = APIRouter()

class RecommendationRequest(BaseModel):
    missing_skills: list[str]
    target_role: str

class InterviewRequest(BaseModel):
    question: str
    candidate_answer: str

@router.post("/recommendations")
def get_career_recommendations(
    req: RecommendationRequest,
    current_user: CurrentUser
) -> Any:
    provider = get_llm_provider()
    skills_str = ", ".join(req.missing_skills)
    prompt = f"I am aiming for a {req.target_role} role but I am missing the following skills: {skills_str}. Give me a short, actionable 3-step career recommendation to learn these."
    
    response = provider.generate(prompt)
    return {"recommendation": response}

@router.post("/interview/evaluate")
def evaluate_interview(
    req: InterviewRequest,
    current_user: CurrentUser
) -> Any:
    provider = get_llm_provider()
    prompt = f"Evaluate this interview answer.\nQuestion: {req.question}\nCandidate Answer: {req.candidate_answer}\nProvide brief, constructive feedback."
    
    response = provider.generate(prompt)
    return {"feedback": response}
