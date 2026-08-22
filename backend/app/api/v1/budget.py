"""
Budget endpoints:
  POST   /trips/{id}/budget-items   — add a manual cost line
  DELETE /budget-items/{id}         — remove a cost line
  GET    /trips/{id}/budget         — full breakdown + grand total
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.core.database import get_db
from app.models.budget_item import BudgetItem
from app.models.trip import Trip
from app.models.user import User
from app.schemas.budget import BudgetItemCreate, BudgetItemOut, BudgetSummary
from app.services.budget_service import get_budget_summary

router = APIRouter(tags=["budget"])


# ---------------------------------------------------------------------------
# Helper — verify trip exists and belongs to current user
# ---------------------------------------------------------------------------

async def _get_trip_owned(
    trip_id: uuid.UUID, user: User, db: AsyncSession
) -> Trip:
    result = await db.execute(select(Trip).where(Trip.id == trip_id))
    trip = result.scalars().first()
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")
    if trip.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your trip.")
    return trip


# ---------------------------------------------------------------------------
# 5.2 — POST /trips/{id}/budget-items
# ---------------------------------------------------------------------------

@router.post(
    "/trips/{trip_id}/budget-items",
    response_model=BudgetItemOut,
    status_code=status.HTTP_201_CREATED,
)
async def add_budget_item(
    trip_id: uuid.UUID,
    payload: BudgetItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Manually add a cost line (e.g. flights, hotel) to a trip."""
    await _get_trip_owned(trip_id, current_user, db)
    item = BudgetItem(trip_id=trip_id, **payload.model_dump())
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


# ---------------------------------------------------------------------------
# 5.3 — DELETE /budget-items/{id}
# ---------------------------------------------------------------------------

@router.delete("/budget-items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget_item(
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a manual budget line item."""
    result = await db.execute(
        select(BudgetItem)
        .join(Trip)
        .where(BudgetItem.id == item_id, Trip.user_id == current_user.id)
    )
    item = result.scalars().first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Budget item not found."
        )
    await db.delete(item)


# ---------------------------------------------------------------------------
# 5.5 — GET /trips/{id}/budget
# ---------------------------------------------------------------------------

@router.get("/trips/{trip_id}/budget", response_model=BudgetSummary)
async def get_trip_budget(
    trip_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Return a full budget breakdown for the trip:
    - Per-category totals (manual items + scheduled activity costs)
    - Grand total
    - is_over_budget flag if budget_cap is set on the trip (5.6)
    """
    await _get_trip_owned(trip_id, current_user, db)
    return await get_budget_summary(trip_id, db)
