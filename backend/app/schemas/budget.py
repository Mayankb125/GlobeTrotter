"""
Pydantic schemas for BudgetItem and the budget summary response.
"""
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# BudgetItem
# ---------------------------------------------------------------------------

VALID_CATEGORIES = {"transport", "stay", "activities", "food", "misc"}


class BudgetItemCreate(BaseModel):
    category: str = Field(..., description="One of: transport, stay, activities, food, misc")
    amount: Decimal = Field(..., ge=0, decimal_places=2)
    currency: str = Field("USD", min_length=3, max_length=10)
    description: Optional[str] = Field(None, max_length=255)


class BudgetItemOut(BaseModel):
    id: uuid.UUID
    trip_id: uuid.UUID
    category: str
    amount: Decimal
    currency: str
    description: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Budget summary response (GET /trips/{id}/budget)
# ---------------------------------------------------------------------------

class CategoryBreakdown(BaseModel):
    """Totals for a single spending category."""
    manual_items_total: Decimal = Decimal("0.00")
    activities_total: Decimal = Decimal("0.00")
    total: Decimal = Decimal("0.00")


class BudgetSummary(BaseModel):
    """Full budget breakdown returned by GET /trips/{id}/budget."""
    trip_id: uuid.UUID
    currency: str = "USD"
    breakdown: Dict[str, CategoryBreakdown]
    grand_total: Decimal
    # 5.6 — optional cap + over-budget flag
    budget_cap: Optional[Decimal] = None
    is_over_budget: Optional[bool] = None
    items: List[BudgetItemOut] = []
