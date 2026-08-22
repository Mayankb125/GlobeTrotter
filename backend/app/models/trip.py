import uuid
from datetime import date, datetime
from typing import List, Optional
from sqlalchemy import String, ForeignKey, Text, Date, Boolean, DateTime, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, GUID


class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[uuid.UUID] = mapped_column(GUID, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    cover_photo_url: Mapped[str] = mapped_column(String(255), nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    share_token: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True)
    budget_cap: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="trips")
    stops: Mapped[List["Stop"]] = relationship(
        back_populates="trip", cascade="all, delete-orphan", order_by="Stop.order_index"
    )
    budget_items: Mapped[List["BudgetItem"]] = relationship(
        back_populates="trip", cascade="all, delete-orphan"
    )
