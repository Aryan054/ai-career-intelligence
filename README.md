# AI Career Intelligence Platform

A fully functional, production-ready AI/ML-powered recruitment and career intelligence SaaS application.

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.103-green.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-blue.svg)](https://github.com/pgvector/pgvector)
[![Celery](https://img.shields.io/badge/Celery-5.3-lightgreen.svg)](https://docs.celeryq.dev/)

## Overview

This platform connects candidates with recruiters using advanced Machine Learning semantic vector embeddings (`pgvector` + `Sentence Transformers`) and NLP-driven skill extraction (`spaCy`). It provides explainable AI scoring, secure authentication (`JWT`), and asynchronous processing (`Celery` + `Redis`).

## Table of Contents

- [Features](#features)
- [Documentation](#documentation)
- [Quick Start (Local Development)](#quick-start-local-development)
- [Running Tests](#running-tests)

## Features

1. **Candidate Dashboard**: Secure JWT-gated access to upload resumes, view dynamic matching scores, and receive generative AI career recommendations. Job cards are expandable for quick reading.
2. **Recruiter Dashboard**: Seamlessly create job postings with full-fledged forms, and instantly receive a ranked, explainable list of the best candidate matches.
3. **Smart Matching Engine**: Combines technical skill intersection with dense vector cosine similarity for highly accurate matches.
4. **Background Processing**: Heavy ML inference and PDF parsing tasks are decoupled into background Celery workers.

*For more details on platform capabilities, please refer to our [Features Documentation](docs/features.md).*

## Documentation

Comprehensive guides and technical documentation are available in the `docs/` directory:

- 📖 **[Features Guide](docs/features.md)**: Detailed breakdown of Candidate and Recruiter capabilities.
- 🏗 **[Architecture Overview](docs/architecture.md)**: Details on the Frontend, Backend, ML Pipeline, and Infrastructure.
- 🔌 **[API Documentation](docs/api.md)**: Endpoints, authentication, and integration details.
- 🛠 **[Setup Guide](docs/setup.md)**: Comprehensive instructions for local development, environment variables, and Docker.

## Quick Start (Local Development)

You must have Docker and Docker Compose installed and running.

1. Clone the repository and navigate to the root directory.
2. Ensure you have an `.env` file containing the necessary secrets (refer to `.env.example`).
3. Boot the infrastructure:
   ```bash
   docker compose up --build -d
   ```
4. Run Database Migrations:
   ```bash
   docker compose exec backend alembic revision --autogenerate -m "init"
   docker compose exec backend alembic upgrade head
   ```
5. Access the Platform:
   - Frontend: `http://localhost:5173`
   - Backend Swagger UI: `http://localhost:8000/docs`

*For more detailed setup instructions, including running locally without Docker, see the [Setup Guide](docs/setup.md).*

## Running Tests

A GitHub Actions CI workflow is configured. To run tests locally:
```bash
docker compose exec backend pytest
```
