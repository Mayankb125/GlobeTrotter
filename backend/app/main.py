from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.api.v1 import api_router

settings = get_settings()

app = FastAPI(
    title="GlobeTrotter API",
    version="0.1.0",
    description="Backend API for GlobeTrotter Travel Planner",
)

# CORS configuration
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Mount all versioned API routes
app.include_router(api_router)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "globetrotter-backend",
        "environment": settings.APP_ENV,
    }
