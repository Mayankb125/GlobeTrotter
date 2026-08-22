"""
Pydantic schemas for the AI-assist endpoint.

Request  → AIAssistRequest   (what the user sends to /trips/{id}/ai-assist)
Response → AIAssistResponse  (what the endpoint returns after persisting the draft)
Error    → AIAssistUnavailable (returned as a 503 detail when the AI layer is down)
"""
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Request
# ---------------------------------------------------------------------------

class AIAssistRequest(BaseModel):
    """
    User preferences forwarded to the LLM planner.
    All fields are optional — the endpoint falls back to sensible defaults
    so that calling with an empty body is valid.
    """
    destination: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="City / region to plan (e.g. 'Goa', 'Tokyo, Japan')",
    )
    home_location: str = Field(
        default="Home",
        max_length=200,
        description="Traveller's origin city, used for transport cost estimates.",
    )
    budget_min: Decimal = Field(
        default=Decimal("5000"),
        ge=0,
        description="Minimum acceptable trip budget (in the chosen currency).",
    )
    budget_max: Decimal = Field(
        default=Decimal("50000"),
        ge=0,
        description="Maximum trip budget (in the chosen currency).",
    )
    travel_style: str = Field(
        default="balanced",
        description="One of: budget / balanced / comfort / luxury.",
    )
    interests: List[str] = Field(
        default_factory=lambda: ["sightseeing"],
        description="e.g. ['history', 'food', 'adventure']",
    )
    dietary_restrictions: List[str] = Field(
        default_factory=list,
        description="e.g. ['vegetarian', 'halal']",
    )
    currency: str = Field(
        default="INR",
        max_length=10,
        description="ISO-4217 currency code.",
    )


# ---------------------------------------------------------------------------
# Response sub-models (mirror the planner output so callers can read it)
# ---------------------------------------------------------------------------

class AIActivityDraft(BaseModel):
    """One activity row as returned by the LLM (before DB persistence)."""
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    cost: Decimal = Decimal("0")
    time_slot: Optional[str] = None          # e.g. "09:00 AM - 12:00 PM"
    transportation: Optional[str] = None


class AIDayDraft(BaseModel):
    """One day's worth of activities as returned by the LLM."""
    day: int
    date: Optional[str] = None
    activities: List[AIActivityDraft] = []


class AIBudgetDraft(BaseModel):
    """Cost breakdown produced by the LLM."""
    accommodation: Decimal = Decimal("0")
    activities: Decimal = Decimal("0")
    food: Decimal = Decimal("0")
    transportation: Decimal = Decimal("0")
    miscellaneous: Decimal = Decimal("0")
    total: Decimal = Decimal("0")
    currency: str = "INR"


# ---------------------------------------------------------------------------
# Response
# ---------------------------------------------------------------------------

class AIAssistResponse(BaseModel):
    """
    What POST /trips/{id}/ai-assist returns after persisting the draft.

    Includes the trip_id so the frontend knows which trip to reload,
    a summary of what was created, and the raw LLM draft for display.
    """
    trip_id: str
    destination: str
    stops_created: int = Field(description="Number of Stop rows inserted.")
    activities_created: int = Field(description="Number of StopActivity rows inserted.")
    budget_items_created: int = Field(description="Number of BudgetItem rows inserted.")
    days_draft: List[AIDayDraft] = Field(
        description="Raw day-by-day plan from the LLM (for UI preview).",
    )
    budget_draft: AIBudgetDraft
    special_notes: Optional[str] = None
    ai_degraded: bool = Field(
        default=False,
        description="True when the AI layer used a fallback/mock response.",
    )


# ---------------------------------------------------------------------------
# 503-style error detail
# ---------------------------------------------------------------------------

class AIAssistUnavailable(BaseModel):
    """
    Returned as the detail payload of a 503 when the AI layer is
    completely unavailable (both API keys missing and fallback also failed).
    """
    error: str = "ai_unavailable"
    message: str = "AI assist is temporarily unavailable. Please try again later."
    degraded: bool = True
