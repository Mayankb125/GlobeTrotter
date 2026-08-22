"""
Pydantic schemas for Activity and StopActivity.
"""
import uuid
from datetime import date, time
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Activity (catalog)
# ---------------------------------------------------------------------------

class ActivityOut(BaseModel):
    id: uuid.UUID
    city_id: uuid.UUID
    name: str
    description: Optional[str] = None
    category: str
    cost_estimate: Decimal
    duration_minutes: Optional[int] = None
    image_url: Optional[str] = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# StopActivity (join between a stop and an activity)
# ---------------------------------------------------------------------------

class StopActivityCreate(BaseModel):
    activity_id: uuid.UUID
    scheduled_date: Optional[date] = None
    scheduled_time: Optional[time] = None
    cost_override: Optional[Decimal] = Field(None, ge=0)
    notes: Optional[str] = None
    order_index: int = Field(0, ge=0)


class StopActivityOut(BaseModel):
    id: uuid.UUID
    stop_id: uuid.UUID
    activity_id: uuid.UUID
    scheduled_date: Optional[date] = None
    scheduled_time: Optional[time] = None
    cost_override: Optional[Decimal] = None
    notes: Optional[str] = None
    order_index: int
    activity: ActivityOut

    model_config = {"from_attributes": True}
