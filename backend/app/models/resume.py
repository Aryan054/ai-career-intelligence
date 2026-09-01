from sqlalchemy import Column, Integer, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
# from pgvector.sqlalchemy import Vector
from app.db.base_class import Base

class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidate_profiles.id", ondelete="CASCADE"))
    
    file_path = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    
    parsed_data = Column(JSON, default={})
    embedding = Column(JSON, nullable=True) # all-MiniLM-L6-v2 outputs 384-dimensional vectors
    status = Column(String, default="UPLOADED") # UPLOADED, PROCESSING, COMPLETED, FAILED

    
    candidate = relationship("CandidateProfile", backref="resumes")
