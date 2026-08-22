import uuid
from datetime import date, datetime
from typing import List
from sqlalchemy import ForeignKey, Date, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, GUID


class Stop(Base):
    __tablename__ = "stops"

    id: Mapped[uuid.UUID] = mapped_column(GUID, primary_key=True, default=uuid.uuid4)
    trip_id: Mapped[uuid.UUID] = mapped_column(GUID, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    city_id: Mapped[uuid.UUID] = mapped_column(GUID, ForeignKey("cities.id", ondelete="RESTRICT"), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    trip: Mapped["Trip"] = relationship(back_populates="stops")
    city: Mapped["City"] = relationship(back_populates="stops")
    stop_activities: Mapped[List["StopActivity"]] = relationship(
        back_populates="stop", cascade="all, delete-orphan", order_by="StopActivity.order_index"
    )
