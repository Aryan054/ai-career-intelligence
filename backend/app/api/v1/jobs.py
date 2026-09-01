from typing import Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.api.deps import SessionDep, CurrentUser
from app.models.job import Job
from app.models.profile import RecruiterProfile
from app.models.resume import Resume
from app.services.matching import calculate_match
from app.ml.embeddings import generate_embedding

router = APIRouter()

class JobCreate(BaseModel):
    title: str
    company_name: str
    company_logo: str | None = None
    description: str
    category: str
    location: dict
    work_mode: str
    office_attendance: str | None = None
    employment_type: str
    experience_level: str
    experience_custom: dict | None = None
    salary_disclosed: bool
    salary_min: int | None = None
    salary_max: int | None = None
    salary_currency: str | None = None
    salary_period: str | None = None
    skills: list[str]
    preferred_skills: list[str] = []
    responsibilities: list[str]
    qualifications: list[str]
    education_level: list[str] = []
    field_of_study: list[str] = []
    benefits: list[str] = []
    openings: int | None = None
    deadline: str
    apply_method: str
    external_link: str | None = None
    application_email: str | None = None
    contact_email: str
    is_draft: bool = False

@router.post("/")
def create_job(
    job_in: JobCreate,
    db: SessionDep,
    current_user: CurrentUser
) -> Any:
    if current_user.role != "RECRUITER":
        raise HTTPException(status_code=403, detail="Only recruiters can post jobs")
        
    recruiter = db.query(RecruiterProfile).filter(RecruiterProfile.user_id == current_user.id).first()
    if not recruiter:
        recruiter = RecruiterProfile(user_id=current_user.id, company_name=job_in.company_name)
        db.add(recruiter)
        db.commit()
        db.refresh(recruiter)
    elif recruiter.company_name != job_in.company_name:
        # Update company name if they changed it
        recruiter.company_name = job_in.company_name
        db.commit()
        
    # Generate embedding for the job synchronously for now (could be backgrounded)
    embedding = generate_embedding(job_in.description)
        
    # Extract implicit skills from the job description
    from app.ml.nlp_pipeline import extract_skills
    implicit_skills = extract_skills(job_in.description)
    
    # Merge implicit and explicit skills (case-insensitive deduplication)
    all_skills_lower = {s.lower().strip() for s in job_in.skills}
    final_skills = list(job_in.skills)
    for skill in implicit_skills:
        if skill.lower().strip() not in all_skills_lower:
            final_skills.append(skill)
            all_skills_lower.add(skill.lower().strip())
            
    job_details = {
        "company_logo": job_in.company_logo,
        "category": job_in.category,
        "location": job_in.location,
        "work_mode": job_in.work_mode,
        "office_attendance": job_in.office_attendance,
        "employment_type": job_in.employment_type,
        "experience_level": job_in.experience_level,
        "experience_custom": job_in.experience_custom,
        "salary": {
            "disclosed": job_in.salary_disclosed,
            "min": job_in.salary_min,
            "max": job_in.salary_max,
            "currency": job_in.salary_currency,
            "period": job_in.salary_period
        },
        "benefits": job_in.benefits,
        "openings": job_in.openings,
        "deadline": job_in.deadline,
        "apply_method": job_in.apply_method,
        "application_email": job_in.application_email,
        "contact_email": job_in.contact_email
    }
        
    job = Job(
        recruiter_id=recruiter.id,
        title=job_in.title,
        description=job_in.description,
        requirements={
            "skills": final_skills,
            "preferred_skills": job_in.preferred_skills,
            "responsibilities": job_in.responsibilities,
            "qualifications": job_in.qualifications,
            "education_level": job_in.education_level,
            "field_of_study": job_in.field_of_study
        },
        job_details=job_details,
        embedding=embedding,
        external_link=job_in.external_link,
        is_draft=job_in.is_draft,
        status="DRAFT" if job_in.is_draft else "OPEN"
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    
    return {"message": "Job created", "job_id": job.id}

@router.get("/")
def list_jobs(db: SessionDep, current_user: CurrentUser) -> Any:
    if current_user.role == "RECRUITER":
        recruiter = db.query(RecruiterProfile).filter(RecruiterProfile.user_id == current_user.id).first()
        if recruiter:
            jobs = db.query(Job).filter(Job.recruiter_id == recruiter.id).all()
        else:
            jobs = []
    else:
        jobs = db.query(Job).all()
    resumes = db.query(Resume).filter(Resume.status == "COMPLETED").all()
    
    from app.models.application import JobApplication
    
    result = []
    for j in jobs:
        match_count = 0
        for r in resumes:
            score = calculate_match(r.parsed_data, {"requirements": j.requirements}, r.embedding, j.embedding)
            if score["overall_score"] > 0:
                match_count += 1
                
        applied_count = db.query(JobApplication).filter(JobApplication.job_id == j.id).count()
        
        result.append({
            "id": j.id, 
            "title": j.title, 
            "description": j.description,
            "job_details": j.job_details,
            "requirements": j.requirements,
            "status": j.status,
            "match_count": match_count,
            "applied_count": applied_count
        })
    return result

@router.get("/{job_id}")
def get_job(job_id: int, db: SessionDep, current_user: CurrentUser) -> Any:
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    return {
        "id": job.id, 
        "title": job.title, 
        "description": job.description,
        "job_details": job.job_details,
        "requirements": job.requirements,
        "status": job.status,
        "is_draft": job.is_draft,
        "external_link": job.external_link,
        "company_name": job.recruiter.company_name if job.recruiter else None
    }

@router.get("/{job_id}/candidates")
def rank_candidates(
    job_id: int,
    db: SessionDep,
    current_user: CurrentUser
) -> Any:
    if current_user.role != "RECRUITER":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    resumes = db.query(Resume).filter(Resume.status == "COMPLETED").all()
    
    matches = []
    for resume in resumes:
        score = calculate_match(
            resume.parsed_data,
            {"requirements": job.requirements},
            resume.embedding,
            job.embedding
        )
        if score["overall_score"] > 0:
            matches.append({
                "resume_id": resume.id,
                "candidate_id": resume.candidate_id,
                "overall_score": score["overall_score"],
                "explanation": score["explanation"]
            })
        
    # Rank descending by score
    matches.sort(key=lambda x: x["overall_score"], reverse=True)
    return matches

@router.put("/{job_id}")
def update_job(
    job_id: int,
    job_in: JobCreate,
    db: SessionDep,
    current_user: CurrentUser
) -> Any:
    if current_user.role != "RECRUITER":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if not job.recruiter or job.recruiter.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this job")
        
    # Generate embedding if description changed
    if job.description != job_in.description:
        job.embedding = generate_embedding(job_in.description)
        
    # Extract implicit skills from the job description
    from app.ml.nlp_pipeline import extract_skills
    implicit_skills = extract_skills(job_in.description)
    
    # Merge implicit and explicit skills (case-insensitive deduplication)
    all_skills_lower = {s.lower().strip() for s in job_in.skills}
    final_skills = list(job_in.skills)
    for skill in implicit_skills:
        if skill.lower().strip() not in all_skills_lower:
            final_skills.append(skill)
            all_skills_lower.add(skill.lower().strip())
            
    job_details = {
        "company_logo": job_in.company_logo,
        "category": job_in.category,
        "location": job_in.location,
        "work_mode": job_in.work_mode,
        "office_attendance": job_in.office_attendance,
        "employment_type": job_in.employment_type,
        "experience_level": job_in.experience_level,
        "experience_custom": job_in.experience_custom,
        "salary": {
            "disclosed": job_in.salary_disclosed,
            "min": job_in.salary_min,
            "max": job_in.salary_max,
            "currency": job_in.salary_currency,
            "period": job_in.salary_period
        },
        "benefits": job_in.benefits,
        "openings": job_in.openings,
        "deadline": job_in.deadline,
        "apply_method": job_in.apply_method,
        "application_email": job_in.application_email,
        "contact_email": job_in.contact_email
    }
        
    job.title = job_in.title
    job.description = job_in.description
    job.requirements = {
        "skills": final_skills,
        "preferred_skills": job_in.preferred_skills,
        "responsibilities": job_in.responsibilities,
        "qualifications": job_in.qualifications,
        "education_level": job_in.education_level,
        "field_of_study": job_in.field_of_study
    }
    job.job_details = job_details
    job.external_link = job_in.external_link
    job.is_draft = job_in.is_draft
    job.status = "DRAFT" if job_in.is_draft else "OPEN"

    # Also update company name if they changed it
    if job.recruiter and job.recruiter.company_name != job_in.company_name:
        job.recruiter.company_name = job_in.company_name
        
    db.commit()
    db.refresh(job)
    
    return {"message": "Job updated", "job_id": job.id}

@router.delete("/{job_id}")
def delete_job(
    job_id: int,
    db: SessionDep,
    current_user: CurrentUser
) -> Any:
    if current_user.role != "RECRUITER":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if not job.recruiter or job.recruiter.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this job")
        
    db.delete(job)
    db.commit()
    return {"message": "Job deleted"}

