# API Documentation

The AI Career Intelligence backend exposes a RESTful API built with **FastAPI**.

For interactive, highly detailed documentation (including request/response schemas and the ability to test endpoints directly in your browser), start the backend server and visit the auto-generated Swagger UI:

👉 **[Interactive Swagger Docs: http://localhost:8000/docs](http://localhost:8000/docs)**

---

## 🔒 Authentication

The API uses **JWT (JSON Web Tokens)** for authentication.

- **Login Endpoint**: `POST /api/v1/auth/login`
- **Format**: `OAuth2PasswordRequestForm` (expects `username` and `password` in form data).
- **Response**: Returns an `access_token` and `token_type` ("bearer").
- **Usage**: Include the token in the `Authorization` header of subsequent requests:
  ```http
  Authorization: Bearer <your_access_token_here>
  ```

---

## 🔑 Key API Endpoints

All endpoints are prefixed with `/api/v1`.

### Auth & Users
- `POST /auth/register`: Register a new user (Requires `email`, `password`, and `role` - `CANDIDATE` or `RECRUITER`).
- `POST /auth/login`: Authenticate and receive a JWT.
- `GET /auth/me`: Get current authenticated user details.
- `GET /profiles/me`: Get the extended profile (name, education, extracted skills) for the current user.
- `PUT /profiles/me`: Update the extended profile details.

### Resumes (Candidates Only)
- `POST /resumes/upload`: Upload a PDF/DOCX resume. This endpoint accepts `multipart/form-data` and triggers the background Celery task for parsing and embedding generation.
- `GET /resumes/me/matches`: Returns the processing status of the latest resume and the list of AI-matched jobs.
- `GET /resumes/{resume_id}/download`: Download the original uploaded resume file.

### Jobs (Recruiters & Candidates)
- `GET /jobs/`: 
  - If requested by a Candidate, returns all active jobs on the platform.
  - If requested by a Recruiter, returns *only* the jobs created by that specific recruiter.
- `GET /jobs/{job_id}`: Get full details of a specific job.
- `POST /jobs/`: (Recruiters Only) Create a new job posting. Triggers background embedding generation.
- `PUT /jobs/{job_id}`: (Recruiters Only) Update an existing job posting.
- `DELETE /jobs/{job_id}`: (Recruiters Only) Delete a job posting.

### Applications
- `POST /applications/`: (Candidates Only) Apply for a specific `job_id`.
- `GET /applications/me`: (Candidates Only) Get a list of job IDs the candidate has applied to.
- `GET /applications/jobs/{job_id}`: (Recruiters Only) Get a list of all applicants for a specific job, ranked by their AI match score. Includes skill gap analysis.

---

## ⚙️ Background Tasks

Certain API endpoints do not execute heavy logic synchronously. Instead, they return immediately while the heavy lifting happens in the background via Celery.

- `POST /resumes/upload` -> Triggers `process_resume_task`
- `POST /jobs/` -> Triggers `generate_job_embedding_task`
- `PUT /jobs/{job_id}` -> Triggers `generate_job_embedding_task` (if description changed)
