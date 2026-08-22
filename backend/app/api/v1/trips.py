"""
Trip CRUD routes — create, list, detail, delete.
Stop management — add, update, reorder.
City + activity search.
StopActivity management — add, remove.
AI-assist — populate an empty trip with an LLM-generated itinerary.
"""
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.deps import get_current_user
from app.core.config import get_settings
from app.core.database import get_db
from app.models.activity import Activity
from app.models.city import City
from app.models.stop import Stop
from app.models.stop_activity import StopActivity
from app.models.trip import Trip
from app.models.user import User
from app.schemas.activity import ActivityOut, StopActivityCreate, StopActivityOut
from app.schemas.ai_assist import AIAssistRequest, AIAssistResponse, AIAssistUnavailable
from app.schemas.stop import StopCreate, StopDetail, StopOut, StopReorderItem, StopUpdate
from app.schemas.trip import TripCreate, TripDetail, TripOut, ShareTokenOut, TripCopyOut
from app.services.ai_assist_service import AIServiceError, run_ai_assist
from app.services.share_service import generate_share_token, revoke_share_token, get_trip_by_share_token, copy_trip

router = APIRouter(tags=["trips"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _trip_not_found() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")


def _stop_not_found() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stop not found.")


async def _get_trip_owned(
    trip_id: uuid.UUID, user: User, db: AsyncSession
) -> Trip:
    result = await db.execute(select(Trip).where(Trip.id == trip_id))
    trip = result.scalars().first()
    if not trip:
        raise _trip_not_found()
    if trip.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your trip.")
    return trip


async def _get_stop_owned(
    stop_id: uuid.UUID, user: User, db: AsyncSession
) -> Stop:
    result = await db.execute(
        select(Stop).join(Trip).where(Stop.id == stop_id, Trip.user_id == user.id)
    )
    stop = result.scalars().first()
    if not stop:
        raise _stop_not_found()
    return stop


# ---------------------------------------------------------------------------
# 4.2 — POST /trips
# ---------------------------------------------------------------------------

@router.post("/trips", response_model=TripOut, status_code=status.HTTP_201_CREATED)
async def create_trip(
    payload: TripCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new trip owned by the authenticated user."""
    trip = Trip(user_id=current_user.id, **payload.model_dump())
    db.add(trip)
    await db.flush()
    await db.refresh(trip)
    return trip


# ---------------------------------------------------------------------------
# 4.3 — GET /trips
# ---------------------------------------------------------------------------

@router.get("/trips", response_model=List[TripOut])
async def list_trips(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all trips belonging to the authenticated user, newest first."""
    result = await db.execute(
        select(Trip)
        .where(Trip.user_id == current_user.id)
        .order_by(Trip.created_at.desc())
    )
    return result.scalars().all()


# ---------------------------------------------------------------------------
# 4.4 — GET /trips/{id}
# ---------------------------------------------------------------------------

@router.get("/trips/{trip_id}", response_model=TripDetail)
async def get_trip(
    trip_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return full nested trip detail (stops → activities)."""
    result = await db.execute(
        select(Trip)
        .options(
            selectinload(Trip.stops)
            .selectinload(Stop.city),
            selectinload(Trip.stops)
            .selectinload(Stop.stop_activities)
            .selectinload(StopActivity.activity),
        )
        .where(Trip.id == trip_id)
    )
    trip = result.scalars().first()
    if not trip:
        raise _trip_not_found()
    if trip.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your trip.")

    # Build TripDetail with nested StopDetail objects
    trip_data = TripDetail.model_validate(trip)
    trip_data.stops = [StopDetail.from_orm_with_city(s) for s in trip.stops]
    return trip_data


# ---------------------------------------------------------------------------
# 4.5 — DELETE /trips/{id}
# ---------------------------------------------------------------------------

@router.delete("/trips/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trip(
    trip_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Permanently delete a trip (and all stops/activities via cascade)."""
    trip = await _get_trip_owned(trip_id, current_user, db)
    await db.delete(trip)


# ---------------------------------------------------------------------------
# 6.2 — POST /trips/{id}/share
# ---------------------------------------------------------------------------

@router.post("/trips/{trip_id}/share", response_model=ShareTokenOut)
async def share_trip(
    trip_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate (or rotate) a share token for a trip.

    Sets is_public=True and returns the token plus a ready-to-copy share URL.
    Requires the authenticated user to own the trip.
    """
    try:
        trip = await generate_share_token(trip_id, current_user.id, db)
    except ValueError as exc:
        # Service raises ValueError for not-found or wrong-owner cases
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )

    settings = get_settings()
    share_url = f"{settings.FRONTEND_URL}/trips/shared/{trip.share_token}"

    return ShareTokenOut(
        trip_id=trip.id,
        share_token=trip.share_token,
        is_public=trip.is_public,
        share_url=share_url,
    )


# ---------------------------------------------------------------------------
# 6.3 — POST /trips/{id}/unshare
# ---------------------------------------------------------------------------

@router.post("/trips/{trip_id}/unshare", response_model=TripOut)
async def unshare_trip(
    trip_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Revoke the share token for a trip, making it private again.

    Clears share_token and sets is_public=False.
    Requires the authenticated user to own the trip.
    """
    try:
        trip = await revoke_share_token(trip_id, current_user.id, db)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return trip


# ---------------------------------------------------------------------------
# 6.4 — GET /public/{share_token}  (no auth)
# ---------------------------------------------------------------------------

@router.get("/public/{share_token}", response_model=TripDetail)
async def get_public_trip(
    share_token: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Public, unauthenticated read of a shared trip.

    Returns the full nested trip (stops → city + activities).
    Responds 404 if the token is invalid or the trip is no longer public.
    """
    # Load the trip with full nesting in one query
    result = await db.execute(
        select(Trip)
        .options(
            selectinload(Trip.stops).selectinload(Stop.city),
            selectinload(Trip.stops)
            .selectinload(Stop.stop_activities)
            .selectinload(StopActivity.activity),
        )
        .where(Trip.share_token == share_token, Trip.is_public.is_(True))
    )
    trip = result.scalars().first()

    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share link is invalid or has been revoked.",
        )

    trip_data = TripDetail.model_validate(trip)
    trip_data.stops = [StopDetail.from_orm_with_city(s) for s in trip.stops]
    return trip_data


# ---------------------------------------------------------------------------
# 6.5 — POST /public/{share_token}/copy  (auth required)
# ---------------------------------------------------------------------------

@router.post(
    "/public/{share_token}/copy",
    response_model=TripCopyOut,
    status_code=status.HTTP_201_CREATED,
)
async def copy_shared_trip(
    share_token: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Deep-clone a public shared trip into the authenticated user's account.

    Copies: Trip → Stops (preserving order) → StopActivities (preserving
    order, dates, cost_override, notes).  The cloned trip starts private.
    Returns the new trip. Responds 404 if the token is invalid or revoked.
    """
    try:
        new_trip = await copy_trip(share_token, current_user.id, db)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return new_trip


# ---------------------------------------------------------------------------
# 4.6 — POST /trips/{id}/stops
# ---------------------------------------------------------------------------

@router.post("/trips/{trip_id}/stops", response_model=StopOut, status_code=status.HTTP_201_CREATED)
async def add_stop(
    trip_id: uuid.UUID,
    payload: StopCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a stop (city + date range) to an existing trip."""
    await _get_trip_owned(trip_id, current_user, db)

    # Verify city exists
    city_result = await db.execute(select(City).where(City.id == payload.city_id))
    if not city_result.scalars().first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found.")

    stop = Stop(trip_id=trip_id, **payload.model_dump())
    db.add(stop)
    await db.flush()
    await db.refresh(stop)
    return stop


# ---------------------------------------------------------------------------
# 4.7 — PUT /stops/{id}
# ---------------------------------------------------------------------------

@router.put("/stops/{stop_id}", response_model=StopOut)
async def update_stop(
    stop_id: uuid.UUID,
    payload: StopUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the date range of a stop."""
    stop = await _get_stop_owned(stop_id, current_user, db)
    update_data = payload.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(stop, field, value)
    await db.flush()
    await db.refresh(stop)
    return stop


# ---------------------------------------------------------------------------
# 4.8 — PUT /trips/{id}/stops/reorder
# ---------------------------------------------------------------------------

@router.put("/trips/{trip_id}/stops/reorder", response_model=List[StopOut])
async def reorder_stops(
    trip_id: uuid.UUID,
    payload: List[StopReorderItem],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Bulk-update order_index for all stops in a trip."""
    await _get_trip_owned(trip_id, current_user, db)

    result = await db.execute(select(Stop).where(Stop.trip_id == trip_id))
    stops_map = {s.id: s for s in result.scalars().all()}

    for item in payload:
        if item.id not in stops_map:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Stop {item.id} not found in this trip.",
            )
        stops_map[item.id].order_index = item.order_index

    await db.flush()
    return sorted(stops_map.values(), key=lambda s: s.order_index)


# ---------------------------------------------------------------------------
# 4.9 — GET /cities
# ---------------------------------------------------------------------------

@router.get("/cities", response_model=List[dict])
async def search_cities(
    search: Optional[str] = Query(None, min_length=1),
    db: AsyncSession = Depends(get_db),
):
    """Search cities by name or country (case-insensitive substring match)."""
    query = select(
        City.id, City.name, City.country, City.region,
        City.cost_index, City.popularity_score, City.image_url,
    )
    if search:
        pattern = f"%{search}%"
        query = query.where(
            City.name.ilike(pattern) | City.country.ilike(pattern)
        )
    query = query.order_by(City.popularity_score.desc()).limit(50)
    result = await db.execute(query)
    rows = result.mappings().all()
    return [dict(r) for r in rows]


# ---------------------------------------------------------------------------
# 4.10 — GET /activities
# ---------------------------------------------------------------------------

@router.get("/activities", response_model=List[ActivityOut])
async def search_activities(
    city_id: Optional[uuid.UUID] = Query(None),
    category: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List activities filtered by city and/or category."""
    query = select(Activity)
    if city_id:
        query = query.where(Activity.city_id == city_id)
    if category:
        query = query.where(Activity.category.ilike(f"%{category}%"))
    query = query.order_by(Activity.name)
    result = await db.execute(query)
    return result.scalars().all()


# ---------------------------------------------------------------------------
# 4.11 — POST /stops/{id}/activities
# ---------------------------------------------------------------------------

@router.post(
    "/stops/{stop_id}/activities",
    response_model=StopActivityOut,
    status_code=status.HTTP_201_CREATED,
)
async def add_activity_to_stop(
    stop_id: uuid.UUID,
    payload: StopActivityCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Schedule an activity onto a stop."""
    stop = await _get_stop_owned(stop_id, current_user, db)

    # Verify activity exists
    act_result = await db.execute(select(Activity).where(Activity.id == payload.activity_id))
    activity = act_result.scalars().first()
    if not activity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found.")

    sa = StopActivity(stop_id=stop.id, **payload.model_dump())
    db.add(sa)
    await db.flush()

    # Reload with activity relationship for response
    result = await db.execute(
        select(StopActivity)
        .options(selectinload(StopActivity.activity))
        .where(StopActivity.id == sa.id)
    )
    return result.scalars().first()


# ---------------------------------------------------------------------------
# 4.12 — DELETE /stop-activities/{id}
# ---------------------------------------------------------------------------

@router.delete("/stop-activities/{sa_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_activity_from_stop(
    sa_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a scheduled activity from a stop."""
    result = await db.execute(
        select(StopActivity)
        .join(Stop)
        .join(Trip)
        .where(StopActivity.id == sa_id, Trip.user_id == current_user.id)
    )
    sa = result.scalars().first()
    if not sa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="StopActivity not found.")
    await db.delete(sa)


# ---------------------------------------------------------------------------
# 7.3 — POST /trips/{id}/ai-assist
# ---------------------------------------------------------------------------

@router.post(
    "/trips/{trip_id}/ai-assist",
    response_model=AIAssistResponse,
    status_code=status.HTTP_200_OK,
    responses={
        503: {
            "description": "AI service unavailable",
            "model": AIAssistUnavailable,
        }
    },
)
async def ai_assist_trip(
    trip_id: uuid.UUID,
    payload: AIAssistRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Populate an existing trip with an AI-generated itinerary.

    Calls the LLM planner (Groq + Gemini) and persists the draft as real
    Stop / Activity / StopActivity / BudgetItem rows, making the result
    immediately editable via the normal CRUD endpoints.

    Graceful degradation (7.4)
    ──────────────────────────
    • Missing API keys  → planner uses its internal stub response; the
      endpoint still succeeds but `ai_degraded=true` in the response.
    • LLM API error     → same as above (planner catches and falls back).
    • Completely broken planner (no daily_schedule at all) → 503 with a
      clean AIAssistUnavailable detail body instead of a 500 stack-trace.
    """
    # Ownership check
    trip = await _get_trip_owned(trip_id, current_user, db)

    try:
        result = await run_ai_assist(trip=trip, request=payload, db=db)
    except AIServiceError as exc:
        # 7.4 — clean 503 instead of crashing
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=AIAssistUnavailable(
                message=str(exc),
            ).model_dump(),
        )

    return result
