import spacy
import re

try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    import spacy.cli
    spacy.cli.download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

# Expanded skill dictionary for exact skill matching
SKILL_DICTIONARY = {
    "react.js": "React",
    "reactjs": "React",
    "react": "React",
    "python": "Python",
    "fastapi": "FastAPI",
    "django": "Django",
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "docker": "Docker",
    "aws": "AWS",
    "machine learning": "Machine Learning",
    "object-oriented programming": "Object-Oriented Programming",
    "oop": "Object-Oriented Programming",
    "data structures": "Data Structures and Algorithms",
    "algorithms": "Data Structures and Algorithms",
    "exception handling": "Exception Handling",
    "file handling": "File Handling",
    "rest apis": "REST APIs",
    "http/https": "HTTP/HTTPS",
    "json": "JSON",
    "authentication": "Authentication and Authorization",
    "authorization": "Authentication and Authorization",
    "jwt": "JWT",
    "api validation": "API validation",
    "sql": "SQL",
    "database design": "Database design",
    "indexing": "Indexing",
    "sqlalchemy": "SQLAlchemy",
    "orm": "ORM concepts",
    "celery": "Celery",
    "redis": "Redis",
    "background jobs": "Background jobs",
    "task queues": "Task queues",
    "caching": "Caching",
    "pytest": "Pytest",
    "unit testing": "Unit testing",
    "integration testing": "Integration testing",
    "api testing": "API testing",
    "test-driven development": "Test-driven development concepts",
    "tdd": "Test-driven development concepts",
    "git": "Git",
    "github": "GitHub",
    "docker compose": "Docker Compose",
    "linux": "Linux fundamentals",
    "ci/cd": "CI/CD fundamentals",
    "nlp": "Natural Language Processing",
    "natural language processing": "Natural Language Processing",
    "scikit-learn": "Scikit-learn",
    "pandas": "Pandas",
    "numpy": "NumPy",
    "xgboost": "XGBoost",
    "sentence transformers": "Sentence Transformers",
    "vector databases": "Vector databases",
    "pgvector": "pgvector",
    "kubernetes": "Kubernetes",
    "github actions": "GitHub Actions",
    "microservices": "Microservices",
    "system design": "System design",
    "websockets": "WebSockets",
    "ml model deployment": "ML model deployment"
}

def clean_text(text: str) -> str:
    # Remove extra horizontal whitespaces but preserve newlines
    text = re.sub(r'[ \t]+', ' ', text)
    # Reduce multiple newlines to single newlines
    text = re.sub(r'\n+', '\n', text)
    return text.strip()

def extract_skills(text: str) -> list[str]:
    text_lower = text.lower()
    doc = nlp(text_lower)
    
    extracted = set()
    
    # 1. Basic dictionary matching
    for token in doc:
        if token.text in SKILL_DICTIONARY:
            extracted.add(SKILL_DICTIONARY[token.text])
            
    for chunk in doc.noun_chunks:
        chunk_text = chunk.text.strip()
        if chunk_text in SKILL_DICTIONARY:
            extracted.add(SKILL_DICTIONARY[chunk_text])
            
    # 2. Extract from "Skills" or "Technical Skills" section
    lines = text.split('\n')
    in_skills_section = False
    for line in lines:
        lower_line = line.lower().strip()
        # Find exact matches for skills sections
        if lower_line.startswith("skills:") or lower_line.startswith("technical skills:") or lower_line == "skills" or lower_line == "technical skills":
            in_skills_section = True
            # Extract skills from this line if there is text after the colon
            parts = line.split(':', 1)
            if len(parts) > 1 and parts[1].strip():
                # Split by commas or bullets
                potential_skills = re.split(r'[,•|]', parts[1])
                for s in potential_skills:
                    if s.strip():
                        extracted.add(s.strip().title())
        elif in_skills_section:
            # Stop if empty line or another major section
            if not lower_line or (lower_line.isupper() and len(lower_line) < 30) or lower_line == "education" or lower_line == "experience":
                break
            
            # If line has a colon, it's likely a category prefix (e.g. "Programming Languages: Python, SQL")
            content = line
            parts = line.split(':', 1)
            if len(parts) > 1:
                content = parts[1]
                
            # Split by commas or bullets
            potential_skills = re.split(r'[,•|]', content)
            for s in potential_skills:
                # Basic filter to ensure it's not a full sentence
                clean_s = s.strip()
                # Remove parenthetical statements like (basic), (expert)
                clean_s = re.sub(r'\(.*?\)', '', clean_s).strip()
                if clean_s and len(clean_s.split()) <= 5:
                    extracted.add(clean_s.title())
            
    return list(extracted)

def extract_education(text: str) -> str | None:
    lines = text.split('\n')
    in_edu_section = False
    education_lines = []
    
    for line in lines:
        lower_line = line.lower().strip()
        if lower_line == "education" or lower_line.startswith("education:"):
            in_edu_section = True
            parts = line.split(':', 1)
            if len(parts) > 1 and parts[1].strip():
                education_lines.append(parts[1].strip())
        elif in_edu_section:
            # Skip empty lines but don't break
            if not lower_line:
                continue
            # Stop if another major section
            if (lower_line.isupper() and len(lower_line) < 30 and lower_line not in ["EDUCATION", "B.E.", "B.TECH", "B.S.", "B.A.", "M.S."]) or lower_line in ["skills", "experience", "projects", "certifications", "work experience", "professional experience"]:
                break
            education_lines.append(line.strip())
            
    if education_lines:
        return "\n".join(education_lines).strip()
    return None

def extract_college_degree(text: str) -> dict[str, str | None]:
    lines = text.split('\n')
    college_name = None
    degree = None
    
    # Very basic heuristics for college and degree
    degree_keywords = ["B.S.", "B.A.", "B.E.", "B.Tech", "M.S.", "Ph.D", "Bachelor", "Master", "BSc", "MSc", "Degree"]
    university_keywords = ["University", "College", "Institute", "Academy"]
    
    for line in lines:
        line_clean = line.strip()
        # Look for university name
        if not college_name and any(kw in line_clean for kw in university_keywords):
            if len(line_clean.split()) <= 15:  # Likely just the name
                college_name = line_clean.lstrip('|').strip()
        
        # Look for degree
        if not degree and any(kw in line_clean for kw in degree_keywords):
            if len(line_clean.split()) <= 15:
                degree = line_clean.strip()
                
        if college_name and degree:
            break
            
    return {"college_name": college_name, "degree": degree}
