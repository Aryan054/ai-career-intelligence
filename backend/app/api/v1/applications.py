from typing import Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.api.deps import SessionDep, CurrentUser
from app.models.application import JobApplication
from app.models.job import Job
from app.models.profile import CandidateProfile, RecruiterProfile
from app.models.resume import Resume
from app.services.matching import calculate_match

router = APIRouter()

class ApplicationCreate(BaseModel):
    job_id: int

@router.post("/")
def apply_for_job(
    app_in: ApplicationCreate,
    db: SessionDep,
    current_user: CurrentUser
) -> Any:
    if current_user.role != "CANDIDATE":
        raise HTTPException(status_code=403, detail="Only candidates can apply for jobs")
        
    candidate = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    job = db.query(Job).filter(Job.id == app_in.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    existing = db.query(JobApplication).filter(
        JobApplication.job_id == job.id,
        JobApplication.candidate_id == candidate.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already applied")
        
    application = JobApplication(
        job_id=job.id,
        candidate_id=candidate.id
    )
    db.add(application)
    db.commit()
    
    return {"message": "Successfully applied"}

@router.get("/me")
def get_my_applications(
    db: SessionDep,
    current_user: CurrentUser
) -> Any:
    if current_user.role != "CANDIDATE":
        raise HTTPException(status_code=403, detail="Only candidates can view their applications")
        
    candidate = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not candidate:
        return []
        
    apps = db.query(JobApplication).filter(JobApplication.candidate_id == candidate.id).all()
    return [app.job_id for app in apps]

@router.get("/jobs/{job_id}")
def get_job_applicants(
    job_id: int,
    db: SessionDep,
    current_user: CurrentUser
) -> Any:
    if current_user.role != "RECRUITER":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    # Check if recruiter owns this job
    if not job.recruiter or job.recruiter.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this job")
        
    applications = db.query(JobApplication).filter(JobApplication.job_id == job_id).all()
    
    results = []
    for app in applications:
        candidate = app.candidate
        if not candidate or not candidate.user:
            continue
        
        # Get candidate's latest resume to get full parsed data/embedding
        resume = db.query(Resume).filter(
            Resume.candidate_id == candidate.id,
            Resume.status == "COMPLETED"
        ).order_by(Resume.id.desc()).first()
        
        parsed_data = resume.parsed_data or {} if resume else {}
        candidate_skills = candidate.skills if candidate.skills else parsed_data.get("skills", [])
        resume_embedding = resume.embedding if resume else None
        
        score = calculate_match(
            {"skills": candidate_skills},
            {"requirements": job.requirements},
            resume_embedding,
            job.embedding
        )
        
        results.append({
            "application_id": app.id,
            "candidate_name": candidate.user.full_name or "Candidate",
            "candidate_email": candidate.user.email,
            "experience_years": candidate.experience_years or 0,
            "current_title": candidate.current_title or "N/A",
            "education": candidate.education or "",
            "college_name": candidate.college_name or "",
            "degree": candidate.degree or "",
            "resume_id": resume.id if resume else None,
            "resume_filename": resume.original_filename if resume else None,
            "resume_text": parsed_data.get("raw_text", ""),
            "overall_score": score["overall_score"],
            "matched_skills": score["matched_skills"],
            "missing_skills": score["missing_skills"],
            "applied_at": app.created_at
        })
        
    # Rank descending by exact match score
    results.sort(key=lambda x: x["overall_score"], reverse=True)
    return results
