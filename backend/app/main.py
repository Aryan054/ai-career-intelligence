from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import setup_logging

logger = setup_logging()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Our engineers have been notified."},
    )

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.v1.auth import router as auth_router
from app.api.v1.resumes import router as resumes_router
from app.api.v1.matching import router as matching_router
from app.api.v1.jobs import router as jobs_router
from app.api.v1.ai import router as ai_router
from app.api.v1.profiles import router as profiles_router
from app.api.v1.applications import router as applications_router

app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(resumes_router, prefix=f"{settings.API_V1_STR}/resumes", tags=["resumes"])
app.include_router(matching_router, prefix=f"{settings.API_V1_STR}/matching", tags=["matching"])
app.include_router(jobs_router, prefix=f"{settings.API_V1_STR}/jobs", tags=["jobs"])
app.include_router(ai_router, prefix=f"{settings.API_V1_STR}/ai", tags=["ai"])
app.include_router(profiles_router, prefix=f"{settings.API_V1_STR}/profiles", tags=["profiles"])
app.include_router(applications_router, prefix=f"{settings.API_V1_STR}/applications", tags=["applications"])

@app.get(f"{settings.API_V1_STR}/health")
def health_check():
    return {"status": "ok", "message": "API is healthy"}

@app.get(f"{settings.API_V1_STR}/health/ready")
def health_ready():
    # In future phases this will check DB and Redis connections
    return {"status": "ok", "message": "API is ready"}
