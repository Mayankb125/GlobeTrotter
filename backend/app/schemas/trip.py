"""
Pydantic schemas for Trip — Create, Update, and Out variants.
"""
import uuid
from datetime import date, datetime
from typing import Optional, List

from pydantic import BaseModel, Field, model_validator


class TripCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    start_date: date
    end_date: date
    cover_photo_url: Optional[str] = None

    @model_validator(mode="after")
    def end_after_start(self) -> "TripCreate":
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class TripUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    cover_photo_url: Optional[str] = None


class TripOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    description: Optional[str] = None
    start_date: date
    end_date: date
    cover_photo_url: Optional[str] = None
    is_public: bool
    share_token: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TripDetail(TripOut):
    """Full trip with nested stops (populated on GET /trips/{id})."""
    stops: List["StopDetail"] = []


# Avoid circular import — resolved at bottom of schemas package
from app.schemas.stop import StopDetail  # noqa: E402
TripDetail.model_rebuild()
