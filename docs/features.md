# AI Career Intelligence - Features Guide

The AI Career Intelligence Platform serves two distinct primary user roles: **Candidates** and **Recruiters**. This guide provides an overview of the key features designed for each role.

---

## 👨‍💻 Candidate Features

The candidate experience focuses on ease of use, automated profile extraction, and discovering the most relevant job opportunities based on AI matching.

### 1. Automated Profile Extraction
- **Resume Parsing**: Candidates can upload their resumes (PDF, DOCX, TXT), which are processed asynchronously in the background.
- **Skill Extraction**: Using NLP (`spaCy`), the platform automatically reads the resume, extracting explicit and implicit skills, and automatically adds them to the candidate's profile.
- **Profile Management**: Candidates can view their automatically generated profile and edit details manually, including adjusting their extracted skills, updating their current title, and education details.

### 2. Intelligent Job Matching
- **Semantic Search**: The system calculates a dense vector representation of the candidate's skills and experience. It compares this against all active job postings to generate an `overall_score`.
- **Top Matches**: Candidates are presented with a prioritized list of jobs tailored specifically to their profile strength.
- **Explainable AI (Why You Match)**: For every job recommendation, the AI provides a generative summary explaining *why* the candidate is a good fit, explicitly outlining the intersection between the candidate's skills and the job's requirements.

### 3. Application Workflow
- **Inline Job Details**: Candidates can seamlessly expand job cards directly on their dashboard to read the full job description.
- **Full Analysis Modal**: Clicking on a job opens a full analysis modal that categorizes "Matched Skills" and "Missing Skills", helping candidates understand their gaps.
- **One-Click Apply**: Candidates can apply for platform-hosted jobs directly or be redirected to external URLs based on the recruiter's setup.

---

## 👔 Recruiter Features

The recruiter experience focuses on streamlined job creation, robust applicant tracking, and leveraging AI to find the right candidates instantly.

### 1. Complete Job Management
- **Detailed Job Postings**: Recruiters can create extensive job postings, specifying work mode (On-site, Hybrid, Remote), employment type, experience requirements, customized salary brackets (with multi-currency support), and detailed descriptions.
- **Full Editing Capabilities**: Published jobs can be modified at any time. The edit form dynamically populates with the existing job state for swift modifications.
- **Inline Job Review**: Recruiters can review exactly how their job descriptions and skill requirements look without navigating away from the dashboard by using the `View Details` inline expansion feature.
- **Drafting & Publishing**: Jobs can be saved as drafts or published directly to candidates.

### 2. Automated AI Sourcing
- **Instant Candidate Matching**: As soon as a job is published (or updated), the AI Matching Engine instantly recalculates matches against the candidate pool.
- **Applicant Tracking**: Recruiters can view all candidates who have explicitly applied to their jobs.
- **Match Scoring**: Every applicant comes with a match score (0-100%) indicating how well their resume aligns with the job requirements.

### 3. Deep Candidate Review
- **Applicant Modal**: Recruiters can view a dedicated modal for each job, listing all applicants ordered by their match score.
- **Skill Gap Analysis**: Recruiters immediately see which skills a candidate possesses and which they lack, according to the job's requirements.
- **Resume Download & Review**: Recruiters can read the raw parsed text of the applicant's resume directly in the browser or download the original uploaded document for a closer look.

---

## ⚙️ Core AI Capabilities

- **Dense Vector Search**: Powered by `pgvector` and `SentenceTransformers`, the platform understands the contextual meaning of skills (e.g., matching "Frontend Development" with "React").
- **Asynchronous Task Queues**: Heavy NLP operations are offloaded to Celery workers, ensuring the UI remains fast and responsive during resume uploads and job updates.
