import os
import fitz  # PyMuPDF
from docx import Document
from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.models.resume import Resume
from app.ml.nlp_pipeline import clean_text, extract_skills
from app.ml.embeddings import generate_embedding

def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    with fitz.open(file_path) as doc:
        for page in doc:
            text += page.get_text()
    return text

def extract_text_from_docx(file_path: str) -> str:
    doc = Document(file_path)
    return "\n".join([para.text for para in doc.paragraphs])

@celery_app.task
def process_resume(resume_id: int):
    db = SessionLocal()
    try:
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume:
            return
            
        resume.status = "PROCESSING"
        db.commit()
        
        file_path = resume.file_path
        ext = os.path.splitext(file_path)[1].lower()
        
        raw_text = ""
        if ext == ".pdf":
            raw_text = extract_text_from_pdf(file_path)
        elif ext in [".docx", ".doc"]:
            raw_text = extract_text_from_docx(file_path)
        elif ext == ".txt":
            with open(file_path, "r", encoding="utf-8") as f:
                raw_text = f.read()
                
        cleaned = clean_text(raw_text)
        skills = extract_skills(cleaned)
        embedding = generate_embedding(cleaned)
        
        from app.ml.nlp_pipeline import extract_education, extract_college_degree
        education = extract_education(cleaned)
        college_degree = extract_college_degree(education) if education else {"college_name": None, "degree": None}
        
        parsed_data = {
            "raw_text": cleaned,
            "skills": skills,
            "education": education,
            "college_name": college_degree.get("college_name"),
            "degree": college_degree.get("degree")
        }
        
        resume.parsed_data = parsed_data
        resume.embedding = embedding
        resume.status = "COMPLETED"
        
        # Merge skills into candidate profile
        if resume.candidate:
            existing_skills = set(resume.candidate.skills) if resume.candidate.skills else set()
            new_skills = set(skills)
            resume.candidate.skills = list(existing_skills.union(new_skills))
            if education:
                resume.candidate.education = education
            if college_degree.get("college_name"):
                resume.candidate.college_name = college_degree.get("college_name")
            if college_degree.get("degree"):
                resume.candidate.degree = college_degree.get("degree")
            
        db.commit()
        
    except Exception as e:
        db.rollback()
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if resume:
            resume.status = "FAILED"
            db.commit()
    finally:
        db.close()
