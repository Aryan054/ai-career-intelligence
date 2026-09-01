from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class JobApplication(Base):
    __tablename__ = "applications"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"))
    candidate_id = Column(Integer, ForeignKey("candidate_profiles.id", ondelete="CASCADE"))
    status = Column(String, default="APPLIED")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    job = relationship("Job", backref="applications")
    candidate = relationship("CandidateProfile", backref="applications")
