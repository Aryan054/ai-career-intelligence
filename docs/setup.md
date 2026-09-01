# Setup & Development Guide

This guide covers how to get the AI Career Intelligence Platform running on your local machine for development and testing.

---

## 🛠 Prerequisites

Ensure you have the following installed on your machine:
- **Docker** and **Docker Compose** (Recommended for easiest setup)
- **Node.js** (v18+) - *If running frontend natively*
- **Python** (3.11+) - *If running backend natively*

---

## 🚀 Quick Start (Dockerized)

The easiest way to get the entire stack (Frontend, Backend, Postgres/pgvector, Redis, and Celery) running is via Docker.

### 1. Environment Configuration
Clone the repository and create your `.env` file based on the template.

```bash
# In the root of the project
cp .env.example .env
```
Ensure the `.env` file contains necessary secrets like `SECRET_KEY`, `POSTGRES_USER`, etc. (The defaults in `.env.example` are usually sufficient for local dev).

### 2. Boot the Infrastructure
Run Docker Compose to build the images and start all containers in detached mode:

```bash
docker compose up --build -d
```

### 3. Initialize the Database
Once the containers are running, you need to apply the database migrations to create the necessary tables in PostgreSQL:

```bash
docker compose exec backend alembic revision --autogenerate -m "init"
docker compose exec backend alembic upgrade head
```

### 4. Access the Application
- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 💻 Running Natively (Without Docker)

If you prefer to run the components directly on your host machine for debugging or rapid development:

### 1. Start Support Services
You still need PostgreSQL (with the `pgvector` extension installed) and Redis running. You can run just these services via Docker:
```bash
docker compose up db redis -d
```

### 2. Backend Setup
Open a new terminal and navigate to the `backend/` directory.

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Run migrations and start the FastAPI server:
```bash
alembic upgrade head
uvicorn app.main:app --reload
```

Start the Celery worker (in a separate terminal):
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
celery -A app.core.celery_app.celery_app worker --loglevel=info
```

### 3. Frontend Setup
Open a new terminal and navigate to the `frontend/` directory.

```bash
cd frontend
npm install
npm run dev
```
The frontend will be available at `http://localhost:5173`.

---

## 🧪 Running Tests

A test suite is included for the backend. 

If running via Docker:
```bash
docker compose exec backend pytest
```

If running natively (ensure your virtual environment is active):
```bash
pytest
```
