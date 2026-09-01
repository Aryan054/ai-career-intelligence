# Architecture Overview

The AI Career Intelligence Platform uses a modern, decoupled microservices-like architecture. It separates the frontend presentation layer from a high-performance backend, which offloads heavy machine learning tasks to background workers.

## 🏗 System Components

### 1. Frontend (Client)
- **Framework**: React 18
- **Build Tool**: Vite (for rapid HMR and optimized builds)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM (v6)
- **State Management**: React Context API (Auth Context)
- **Network**: Axios (with centralized interceptors for JWT token attachment)

The frontend is designed to be highly responsive and completely decoupled from the backend, communicating exclusively via RESTful APIs.

### 2. Backend (API Server)
- **Framework**: FastAPI (Python 3.11)
- **ORM**: SQLAlchemy 2.0 (Async/Sync hybrid depending on use case)
- **Authentication**: JWT (JSON Web Tokens) with OAuth2 Password Bearer flow
- **Validation**: Pydantic V2

FastAPI provides automatic OpenAPI (Swagger) documentation and high performance. It handles immediate user requests, database queries, and orchestrates tasks.

### 3. Background Task Processing
- **Task Queue**: Celery (v5.3)
- **Message Broker & Result Backend**: Redis

**Why Celery?** 
Machine learning inference (generating embeddings) and PDF parsing (extracting text via PyPDF2/spaCy) are CPU-bound and slow. Offloading these to Celery ensures the FastAPI server remains unblocked and highly responsive to web requests.

### 4. Database & Vector Search
- **Relational Database**: PostgreSQL (v15+)
- **Vector Extension**: `pgvector`

`pgvector` allows us to store the generated machine learning embeddings (`VECTOR(384)`) directly alongside relational data (like User IDs and Job details) and perform blazing-fast cosine similarity searches directly within SQL queries.

### 5. Machine Learning Pipeline
The ML pipeline is heavily utilized for matching Candidates to Jobs.
- **NLP Processing (`spaCy`)**: Used to parse raw resume text, normalize terms, and extract specific skill entities.
- **Embeddings (`SentenceTransformers`)**: Uses the `all-MiniLM-L6-v2` model to convert a list of skills into a dense 384-dimensional vector. This allows the system to understand that "React" and "Frontend Developer" are semantically similar.
- **Generative AI Layer**: A custom LLM abstraction generates the "Why You Match" explanations. (Currently designed to plug into OpenAI or local open-source LLMs).

---

## 🔄 Data Flow: Resume Upload Example

1. **User Action**: Candidate uploads a PDF resume via the React frontend.
2. **API Request**: Axios sends a `multipart/form-data` POST request to FastAPI (`/api/v1/resumes/upload`).
3. **Database Entry**: FastAPI creates a `Resume` record in PostgreSQL with `status="PROCESSING"`.
4. **Task Delegation**: FastAPI triggers a Celery task (`process_resume_task.delay(resume_id)`) and immediately returns a 202 Accepted response to the user.
5. **Background Work (Celery)**:
   - The Celery worker picks up the task.
   - Extracts raw text from the PDF.
   - Runs `spaCy` to extract skills.
   - Runs `SentenceTransformers` to generate a 384D embedding of the skills.
   - Updates the PostgreSQL `Resume` record with the extracted text, skills, embedding, and sets `status="SUCCESS"`.
6. **User Polling**: The React frontend periodically polls `/resumes/me/matches`. Once the status is `SUCCESS`, it retrieves the newly generated matches.
