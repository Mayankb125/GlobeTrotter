"""
AI-Assist service.

Orchestrates the full pipeline:
  1. Call generate_itinerary() from planner.py
  2. Map the LLM JSON output → real DB rows:
       City (find or create)  →  Stop  →  Activity (find or create)
       →  StopActivity  +  BudgetItem rows from cost_breakdown
  3. Return an AIAssistResponse summarising what was persisted.

Graceful-degradation contract
──────────────────────────────
• Both GroqClient and GeminiResearchClient already have internal fallbacks
  that return mock/stub data when keys are missing.  This service never
  crashes on an AI failure — it surfaces the degraded flag instead.
• If the planner returns structurally invalid JSON that cannot be mapped at
  all, an AIServiceError is raised so the endpoint can return a clean 503.
"""
from __future__ import annotations

import logging
import uuid
from datetime import date, timedelta
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.planner import generate_itinerary
from app.models.activity import Activity
from app.models.budget_item import BudgetItem
from app.models.city import City
from app.models.stop import Stop
from app.models.stop_activity import StopActivity
from app.models.trip import Trip
from app.schemas.ai_assist import (
    AIActivityDraft,
    AIAssistRequest,
    AIAssistResponse,
    AIBudgetDraft,
    AIDayDraft,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Public exception — endpoint catches this and returns 503
# ---------------------------------------------------------------------------

class AIServiceError(Exception):
    """Raised when the AI pipeline fails unrecoverably."""


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _to_decimal(value: Any, default: Decimal = Decimal("0")) -> Decimal:
    """Safely coerce an arbitrary value to Decimal."""
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return default


def _parse_days(raw: Dict[str, Any]) -> List[AIDayDraft]:
    """
    Convert the planner's daily_schedule list into AIDayDraft objects.
    Tolerates missing / malformed fields rather than raising.
    """
    days: List[AIDayDraft] = []
    for day_raw in raw.get("daily_schedule", []):
        activities: List[AIActivityDraft] = []
        for act in day_raw.get("activities", []):
            activities.append(
                AIActivityDraft(
                    name=act.get("name", "Activity"),
                    description=act.get("description"),
                    location=act.get("location"),
                    cost=_to_decimal(act.get("cost", 0)),
                    time_slot=act.get("time"),
                    transportation=act.get("transportation"),
                )
            )
        days.append(
            AIDayDraft(
                day=day_raw.get("day", len(days) + 1),
                date=str(day_raw.get("date", "")),
                activities=activities,
            )
        )
    return days


def _parse_budget(raw: Dict[str, Any]) -> AIBudgetDraft:
    """Convert the planner's cost_breakdown dict into AIBudgetDraft."""
    cb = raw.get("cost_breakdown", {})
    return AIBudgetDraft(
        accommodation=_to_decimal(cb.get("accommodation", 0)),
        activities=_to_decimal(cb.get("activities", 0)),
        food=_to_decimal(cb.get("food", 0)),
        transportation=_to_decimal(cb.get("transportation", 0)),
        miscellaneous=_to_decimal(cb.get("miscellaneous", 0)),
        total=_to_decimal(cb.get("total", 0)),
        currency=str(cb.get("currency", "INR")),
    )


async def _find_or_create_city(name: str, db: AsyncSession) -> City:
    """Return an existing City by name (case-insensitive) or create one."""
    result = await db.execute(
        select(City).where(City.name.ilike(name))
    )
    city = result.scalars().first()
    if city:
        return city
    city = City(name=name.title(), country="Unknown")
    db.add(city)
    await db.flush()
    return city


async def _find_or_create_activity(
    name: str,
    description: str | None,
    cost: Decimal,
    city: City,
    db: AsyncSession,
) -> Activity:
    """
    Return an existing Activity for this city by name, or create a new one.
    Uses case-insensitive match to avoid duplicates on repeated AI calls.
    """
    result = await db.execute(
        select(Activity).where(
            Activity.city_id == city.id,
            Activity.name.ilike(name),
        )
    )
    activity = result.scalars().first()
    if activity:
        return activity
    activity = Activity(
        city_id=city.id,
        name=name[:150],
        description=description,
        category="sightseeing",     # default; user can edit later
        cost_estimate=cost if cost > 0 else Decimal("0"),
    )
    db.add(activity)
    await db.flush()
    return activity


def _compute_stop_dates(
    trip: Trip,
    day_number: int,
    total_days: int,
) -> tuple[date, date]:
    """
    Derive start/end dates for a stop based on the trip's own dates.
    Each day in the itinerary maps to one calendar day of the trip.
    """
    trip_start = trip.start_date
    trip_end = trip.end_date
    trip_duration = max((trip_end - trip_start).days, total_days - 1)

    # day_number is 1-indexed
    day_offset = day_number - 1
    stop_start = trip_start + timedelta(days=day_offset)
    # end date is same day (single-day stop) unless it overruns the trip
    stop_end = min(stop_start, trip_end)
    return stop_start, stop_end


# ---------------------------------------------------------------------------
# Main service function
# ---------------------------------------------------------------------------

async def run_ai_assist(
    trip: Trip,
    request: AIAssistRequest,
    db: AsyncSession,
) -> AIAssistResponse:
    """
    Run the full AI-assist pipeline for an existing trip.

    Steps
    -----
    1. Call generate_itinerary() — has internal fallback, never raises on AI failure.
    2. Parse days / budget from the returned dict.
    3. Persist: City → Stop → Activity → StopActivity → BudgetItem.
    4. Return AIAssistResponse with counts and the raw draft.

    Raises
    ------
    AIServiceError  — only if the planner returns something so malformed that
                      no daily_schedule can be extracted at all.
    """
    # ------------------------------------------------------------------
    # 1. Call the LLM pipeline
    # ------------------------------------------------------------------
    ai_degraded = False
    try:
        raw: Dict[str, Any] = await generate_itinerary(
            destination=request.destination,
            start_date=str(trip.start_date),
            end_date=str(trip.end_date),
            home_location=request.home_location,
            budget_min=float(request.budget_min),
            budget_max=float(request.budget_max),
            travel_style=request.travel_style,
            interests=request.interests,
            dietary_restrictions=request.dietary_restrictions,
            currency=request.currency,
        )
    except Exception as exc:
        logger.error(f"generate_itinerary raised unexpectedly: {exc}", exc_info=True)
        raise AIServiceError("AI itinerary generation failed.") from exc

    # Detect if we got the stub/fallback response (special_notes gives it away)
    if "fallback" in str(raw.get("special_notes", "")).lower():
        ai_degraded = True

    # ------------------------------------------------------------------
    # 2. Parse the raw output into typed drafts
    # ------------------------------------------------------------------
    days_draft = _parse_days(raw)
    budget_draft = _parse_budget(raw)

    if not days_draft:
        raise AIServiceError(
            "AI returned an itinerary with no daily_schedule — cannot persist."
        )

    destination_name = raw.get("destination", request.destination)
    total_days = len(days_draft)

    # ------------------------------------------------------------------
    # 3. Find / create the destination city
    # ------------------------------------------------------------------
    city = await _find_or_create_city(destination_name, db)

    # ------------------------------------------------------------------
    # 4. Persist one Stop per day + Activities + StopActivities
    # ------------------------------------------------------------------
    stops_created = 0
    activities_created = 0

    for day_draft in days_draft:
        stop_start, stop_end = _compute_stop_dates(trip, day_draft.day, total_days)

        stop = Stop(
            trip_id=trip.id,
            city_id=city.id,
            start_date=stop_start,
            end_date=stop_end,
            order_index=day_draft.day - 1,
        )
        db.add(stop)
        await db.flush()
        stops_created += 1

        for order_idx, act_draft in enumerate(day_draft.activities):
            activity = await _find_or_create_activity(
                name=act_draft.name,
                description=act_draft.description,
                cost=act_draft.cost,
                city=city,
                db=db,
            )

            sa = StopActivity(
                stop_id=stop.id,
                activity_id=activity.id,
                notes=act_draft.time_slot,   # store the time-slot in notes
                cost_override=(
                    act_draft.cost if act_draft.cost > 0 else None
                ),
                order_index=order_idx,
            )
            db.add(sa)
            activities_created += 1

    await db.flush()

    # ------------------------------------------------------------------
    # 5. Persist BudgetItems from the cost_breakdown
    # ------------------------------------------------------------------
    budget_items_created = 0
    currency = budget_draft.currency

    budget_map = {
        "transport": budget_draft.transportation,
        "stay": budget_draft.accommodation,
        "activities": budget_draft.activities,
        "food": budget_draft.food,
        "misc": budget_draft.miscellaneous,
    }

    for category, amount in budget_map.items():
        if amount > 0:
            db.add(
                BudgetItem(
                    trip_id=trip.id,
                    category=category,
                    amount=amount,
                    currency=currency,
                    description=f"AI-generated estimate ({category})",
                )
            )
            budget_items_created += 1

    await db.flush()

    # ------------------------------------------------------------------
    # 6. Return response
    # ------------------------------------------------------------------
    return AIAssistResponse(
        trip_id=str(trip.id),
        destination=destination_name,
        stops_created=stops_created,
        activities_created=activities_created,
        budget_items_created=budget_items_created,
        days_draft=days_draft,
        budget_draft=budget_draft,
        special_notes=raw.get("special_notes"),
        ai_degraded=ai_degraded,
    )
