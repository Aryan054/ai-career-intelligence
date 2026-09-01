from sqlalchemy import Column, Integer, String, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
# from pgvector.sqlalchemy import Vector
from app.db.base_class import Base

class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    recruiter_id = Column(Integer, ForeignKey("recruiter_profiles.id", ondelete="CASCADE"))
    
    title = Column(String, index=True, nullable=False)
    description = Column(String, nullable=False)
    requirements = Column(JSON, default={}) # Store skills, experience
    job_details = Column(JSON, default={}) # Store extra fields
    embedding = Column(JSON, nullable=True) # all-MiniLM-L6-v2 outputs 384-dimensional vectors
    status = Column(String, default="OPEN")
    is_draft = Column(Boolean, default=False)
    external_link = Column(String, nullable=True)

    
    recruiter = relationship("RecruiterProfile", backref="jobs")
