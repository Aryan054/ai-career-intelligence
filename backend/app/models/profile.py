from sqlalchemy import Column, Integer, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    
    # Store flexible data here for now
    skills = Column(JSON, default=[])
    experience_years = Column(Integer, default=0)
    current_title = Column(String, nullable=True)
    education = Column(String, nullable=True)
    college_name = Column(String, nullable=True)
    degree = Column(String, nullable=True)
    
    user = relationship("User", backref="candidate_profile")

class RecruiterProfile(Base):
    __tablename__ = "recruiter_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    
    company_name = Column(String, nullable=True)
    
    user = relationship("User", backref="recruiter_profile")
