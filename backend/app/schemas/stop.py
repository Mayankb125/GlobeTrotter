"""
Pydantic schemas for Stop — Create, Update, and Out variants.
"""
import uuid
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field, model_validator

from app.schemas.activity import StopActivityOut


class StopCreate(BaseModel):
    city_id: uuid.UUID
    start_date: date
    end_date: date
    order_index: int = Field(0, ge=0)

    @model_validator(mode="after")
    def end_after_start(self) -> "StopCreate":
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class StopUpdate(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class StopReorderItem(BaseModel):
    """Single item in the bulk reorder payload."""
    id: uuid.UUID
    order_index: int = Field(..., ge=0)


class StopOut(BaseModel):
    id: uuid.UUID
    trip_id: uuid.UUID
    city_id: uuid.UUID
    start_date: date
    end_date: date
    order_index: int
    created_at: datetime

    model_config = {"from_attributes": True}


class StopDetail(StopOut):
    """Stop with nested city info and scheduled activities."""
    city_name: Optional[str] = None
    city_country: Optional[str] = None
    stop_activities: List[StopActivityOut] = []

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_city(cls, stop) -> "StopDetail":
        data = StopDetail.model_validate(stop)
        if stop.city:
            data.city_name = stop.city.name
            data.city_country = stop.city.country
        return data
