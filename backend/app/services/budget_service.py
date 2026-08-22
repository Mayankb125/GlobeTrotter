"""
Budget aggregation service.

Aggregates manual BudgetItems + activity costs (via StopActivity.cost_override
or Activity.cost_estimate) and groups them into a per-category breakdown with
a grand total, and optionally compares against the trip's budget_cap.
"""
import uuid
from decimal import Decimal
from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.activity import Activity
from app.models.budget_item import BudgetItem
from app.models.stop import Stop
from app.models.stop_activity import StopActivity
from app.models.trip import Trip
from app.schemas.budget import BudgetItemOut, BudgetSummary, CategoryBreakdown

# The five canonical spending categories
CATEGORIES = ["transport", "stay", "activities", "food", "misc"]


async def get_budget_summary(trip_id: uuid.UUID, db: AsyncSession) -> BudgetSummary:
    """
    Build a full BudgetSummary for the given trip.

    Manual items  → grouped directly by their category field.
    Activity costs → always go into the "activities" category; uses
                     cost_override when set, otherwise activity.cost_estimate.
    """
    # ------------------------------------------------------------------
    # 1. Fetch all manual budget items for this trip
    # ------------------------------------------------------------------
    items_result = await db.execute(
        select(BudgetItem).where(BudgetItem.trip_id == trip_id)
    )
    manual_items: List[BudgetItem] = items_result.scalars().all()

    # ------------------------------------------------------------------
    # 2. Fetch all stop-activities for this trip (with activity costs)
    # ------------------------------------------------------------------
    sa_result = await db.execute(
        select(StopActivity)
        .join(Stop)
        .options(selectinload(StopActivity.activity))
        .where(Stop.trip_id == trip_id)
    )
    stop_activities: List[StopActivity] = sa_result.scalars().all()

    # ------------------------------------------------------------------
    # 3. Fetch the trip itself for budget_cap
    # ------------------------------------------------------------------
    trip_result = await db.execute(select(Trip).where(Trip.id == trip_id))
    trip: Trip = trip_result.scalars().first()

    # ------------------------------------------------------------------
    # 4. Build breakdown dict initialised to zeros
    # ------------------------------------------------------------------
    breakdown: dict[str, CategoryBreakdown] = {
        cat: CategoryBreakdown() for cat in CATEGORIES
    }

    # Sum manual items per category
    for item in manual_items:
        cat = item.category if item.category in CATEGORIES else "misc"
        breakdown[cat].manual_items_total += Decimal(str(item.amount))

    # Sum activity costs into "activities" bucket
    for sa in stop_activities:
        cost = (
            Decimal(str(sa.cost_override))
            if sa.cost_override is not None
            else Decimal(str(sa.activity.cost_estimate))
        )
        breakdown["activities"].activities_total += cost

    # Compute per-category totals
    for cat_data in breakdown.values():
        cat_data.total = cat_data.manual_items_total + cat_data.activities_total

    grand_total = sum(c.total for c in breakdown.values())

    # ------------------------------------------------------------------
    # 5. Over-budget flag
    # ------------------------------------------------------------------
    budget_cap = Decimal(str(trip.budget_cap)) if trip and trip.budget_cap else None
    is_over_budget = (grand_total > budget_cap) if budget_cap is not None else None

    return BudgetSummary(
        trip_id=trip_id,
        breakdown=breakdown,
        grand_total=grand_total,
        budget_cap=budget_cap,
        is_over_budget=is_over_budget,
        items=[BudgetItemOut.model_validate(i) for i in manual_items],
    )
