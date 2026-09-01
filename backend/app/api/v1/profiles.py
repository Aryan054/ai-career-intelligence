from typing import Any, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.api.deps import SessionDep, CurrentUser
from app.models.profile import CandidateProfile

router = APIRouter()

class ProfileUpdate(BaseModel):
    full_name: str | None = None
    skills: List[str] = []
    experience_years: int = 0
    current_title: str | None = None
    education: str | None = None
    college_name: str | None = None
    degree: str | None = None

@router.get("/me")
def get_my_profile(
    db: SessionDep,
    current_user: CurrentUser
) -> Any:
    if current_user.role != "CANDIDATE":
        raise HTTPException(status_code=403, detail="Only candidates have a candidate profile")
        
    candidate = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not candidate:
        # Auto-create if not exists
        candidate = CandidateProfile(user_id=current_user.id)
        db.add(candidate)
        db.commit()
        db.refresh(candidate)
        
    from app.models.resume import Resume
    
    resume = db.query(Resume).filter(
        Resume.candidate_id == candidate.id,
        Resume.status == "COMPLETED"
    ).order_by(Resume.id.desc()).first()
    
    return {
        "id": candidate.id,
        "full_name": candidate.user.full_name,
        "skills": candidate.skills,
        "experience_years": candidate.experience_years,
        "current_title": candidate.current_title,
        "education": candidate.education,
        "college_name": candidate.college_name,
        "degree": candidate.degree,
        "latest_resume_filename": resume.original_filename if resume else None
    }

@router.put("/me")
def update_my_profile(
    profile_in: ProfileUpdate,
    db: SessionDep,
    current_user: CurrentUser
) -> Any:
    if current_user.role != "CANDIDATE":
        raise HTTPException(status_code=403, detail="Only candidates have a candidate profile")
        
    candidate = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not candidate:
        candidate = CandidateProfile(user_id=current_user.id)
        db.add(candidate)
        
    candidate.skills = profile_in.skills
    candidate.experience_years = profile_in.experience_years
    candidate.current_title = profile_in.current_title
    candidate.education = profile_in.education
    candidate.college_name = profile_in.college_name
    candidate.degree = profile_in.degree
    
    if profile_in.full_name is not None:
        candidate.user.full_name = profile_in.full_name
    
    db.commit()
    db.refresh(candidate)
    
    return {
        "message": "Profile updated",
        "profile": {
            "id": candidate.id,
            "full_name": candidate.user.full_name,
            "skills": candidate.skills,
            "experience_years": candidate.experience_years,
            "current_title": candidate.current_title,
            "college_name": candidate.college_name,
            "degree": candidate.degree
        }
    }
