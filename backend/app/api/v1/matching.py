from fastapi import APIRouter, HTTPException
from typing import Any
from app.api.deps import SessionDep, CurrentUser
from app.models.resume import Resume
from app.models.job import Job
from app.services.matching import calculate_match

router = APIRouter()

@router.post("/analyze")
def analyze_match(
    resume_id: int,
    job_id: int,
    db: SessionDep,
    current_user: CurrentUser
) -> Any:
    # Fetch Resume
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    # Fetch Job
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if not resume.embedding:
        raise HTTPException(status_code=400, detail="Resume embedding not generated yet.")
    if not job.embedding:
        # In a real scenario, this would be computed upon job creation.
        raise HTTPException(status_code=400, detail="Job embedding not generated yet.")
        
    # Calculate match
    result = calculate_match(
        resume_data=resume.parsed_data,
        job_data={"requirements": job.requirements},
        resume_vector=resume.embedding,
        job_vector=job.embedding
    )
    
    return {
        "resume_id": resume.id,
        "job_id": job.id,
        "match_results": result
    }
