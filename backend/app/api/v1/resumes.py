import os
import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from app.api.deps import SessionDep, CurrentUser
from app.models.resume import Resume
from app.models.profile import CandidateProfile
from app.services.storage import save_upload_file
from app.tasks.resume_tasks import process_resume

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt"}

@router.post("/upload")
def upload_resume(
    db: SessionDep,
    current_user: CurrentUser,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
) -> Any:
    if current_user.role != "CANDIDATE":
        raise HTTPException(status_code=403, detail="Only candidates can upload resumes")
        
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid file type")
        
    candidate = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not candidate:
        # Auto-create profile for demo purposes if it doesn't exist
        candidate = CandidateProfile(user_id=current_user.id)
        db.add(candidate)
        db.commit()
        db.refresh(candidate)

    # Save file
    filename = f"{uuid.uuid4()}{ext}"
    file_path = save_upload_file(file, filename)
    
    # Create DB record
    resume = Resume(
        candidate_id=candidate.id,
        file_path=file_path,
        original_filename=file.filename,
        status="UPLOADED"
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    
    # Use FastAPI BackgroundTasks instead of Celery since Redis is not running
    background_tasks.add_task(process_resume, resume.id)
    
    return {"message": "Resume uploaded and processing started", "resume_id": resume.id}

@router.get("/{resume_id}")
def get_resume_status(
    resume_id: int,
    db: SessionDep,
    current_user: CurrentUser
) -> Any:
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    # Security check: ensure candidate owns this resume or is a recruiter
    if current_user.role == "CANDIDATE" and resume.candidate.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    return {
        "id": resume.id,
        "filename": resume.original_filename,
        "status": resume.status,
        "parsed_data": resume.parsed_data
    }

from fastapi.responses import FileResponse

@router.get("/{resume_id}/download")
def download_resume(
    resume_id: int,
    db: SessionDep,
    current_user: CurrentUser
) -> Any:
    resume = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    # Check authorization (Candidate owns it OR Recruiter)
    if current_user.role == "CANDIDATE" and resume.candidate.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if not os.path.exists(resume.file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
        
    return FileResponse(
        path=resume.file_path,
        filename=resume.original_filename,
        media_type="application/octet-stream"
    )

from app.models.job import Job
from app.services.matching import calculate_match

@router.get("/me/matches")
def get_my_matches(
    db: SessionDep,
    current_user: CurrentUser
) -> Any:
    if current_user.role != "CANDIDATE":
        raise HTTPException(status_code=403, detail="Only candidates can view matches")
        
    candidate = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    # Get latest completed resume
    resume = db.query(Resume).filter(
        Resume.candidate_id == candidate.id, 
        Resume.status == "COMPLETED"
    ).order_by(Resume.id.desc()).first()
    
    jobs = db.query(Job).all()
    matches = []
    
    if not resume or not resume.parsed_data:
        # Return all jobs with 0 match
        for job in jobs:
            matches.append({
                "job_id": job.id,
                "title": job.title,
                "description": job.description,
                "overall_score": 0,
                "explanation": ["No resume uploaded to calculate match."]
            })
        return {"status": "NO_RESUME", "matches": matches}
        
    for job in jobs:
        # Use profile skills if available, fallback to parsed resume data if not
        candidate_skills = candidate.skills if candidate.skills else resume.parsed_data.get("skills", [])
        
        score = calculate_match(
            {"skills": candidate_skills},
            {"requirements": job.requirements},
            resume.embedding,
            job.embedding
        )
        matches.append({
            "job_id": job.id,
            "title": job.title,
            "description": job.description,
            "job_details": job.job_details,
            "requirements": job.requirements,
            "overall_score": score["overall_score"],
            "explanation": score["explanation"],
            "matched_skills": score["matched_skills"],
            "missing_skills": score["missing_skills"],
            "external_link": job.external_link
        })
        
    # Rank descending by score
    matches.sort(key=lambda x: x["overall_score"], reverse=True)
    return {"status": "SUCCESS", "matches": matches}
