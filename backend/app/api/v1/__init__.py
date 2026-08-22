"""API v1 router package."""
from fastapi import APIRouter

from app.api.v1 import auth, trips, budget

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(trips.router)
api_router.include_router(budget.router)
