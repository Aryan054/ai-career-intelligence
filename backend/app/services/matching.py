from typing import Any
import numpy as np

def cosine_similarity(vec1: list[float], vec2: list[float]) -> float:
    v1 = np.array(vec1)
    v2 = np.array(vec2)
    
    if np.linalg.norm(v1) == 0 or np.linalg.norm(v2) == 0:
        return 0.0
        
    return float(np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2)))

def calculate_match(resume_data: dict, job_data: dict, resume_vector: list[float], job_vector: list[float]) -> dict[str, Any]:
    """
    Calculates a weighted match score between a resume and a job description.
    Weights: Technical Skill Match = 40%, Semantic Similarity = 60%
    """
    resume_skills = set(resume_data.get("skills", []) or [])
    
    reqs = job_data.get("requirements") or {}
    job_skills = set(reqs.get("skills", []) or [])
    
    # Calculate Semantic Similarity (60% weight if available)
    if resume_vector and job_vector:
        semantic_score = cosine_similarity(resume_vector, job_vector)
        semantic_weight = 60
    else:
        semantic_score = 0
        semantic_weight = 0
        
    semantic_weighted = semantic_score * semantic_weight
    
    # Calculate Skill Match (case-insensitive)
    matched_skills = []
    missing_skills = []
    
    resume_skills_lower = {s.lower().strip() for s in resume_skills}
    
    if len(job_skills) > 0:
        for js in job_skills:
            if js.lower().strip() in resume_skills_lower:
                matched_skills.append(js)
            else:
                missing_skills.append(js)
        skill_score = len(matched_skills) / len(job_skills)
    else:
        skill_score = 1.0  # If no skills required, full score for this portion
        
    # Scale skill weight to 100 if semantic similarity is unavailable
    skill_weight = 40 if semantic_weight > 0 else 100
    skill_weighted = skill_score * skill_weight
    
    # Final Score
    total_score = round(semantic_weighted + skill_weighted, 2)
    
    # Explainability
    explanation = []
    if len(matched_skills) > 0:
        explanation.append(f"Matched {len(matched_skills)} required skills (+{round(skill_weighted, 1)} pts).")
    if len(missing_skills) > 0:
        explanation.append(f"Missing {len(missing_skills)} required skills.")
        
    if semantic_weight > 0:
        explanation.append(f"Semantic similarity score: {round(semantic_score * 100, 1)}% (+{round(semantic_weighted, 1)} pts).")
    else:
        explanation.append("Semantic similarity disabled (AI vectors unavailable).")
    
    return {
        "overall_score": total_score,
        "component_scores": {
            "semantic_similarity": round(semantic_weighted, 2),
            "technical_skills": round(skill_weighted, 2)
        },
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "explanation": explanation
    }
