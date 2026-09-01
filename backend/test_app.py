import asyncio
import json
from app.db.session import SessionLocal
from app.api.v1.applications import get_job_applicants
from app.models.user import User
from app.models.profile import RecruiterProfile
from app.models.job import Job

def test_applications():
    db = SessionLocal()
    # Find a job with applications
    job = db.query(Job).filter(Job.applications.any()).first()
    if not job:
        print("No job with applications found.")
        return
        
    print(f"Testing for job {job.id}")
    
    recruiter = db.query(RecruiterProfile).filter(RecruiterProfile.id == job.recruiter_id).first()
    user = db.query(User).filter(User.id == recruiter.user_id).first()
    
    try:
        results = get_job_applicants(job.id, db, user)
        print("Success:", results)
    except Exception as e:
        import traceback
        traceback.print_exc()
        
if __name__ == "__main__":
    test_applications()
