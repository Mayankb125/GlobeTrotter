import uuid
from datetime import date, time
from sqlalchemy import ForeignKey, Date, Time, Numeric, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, GUID


class StopActivity(Base):
    __tablename__ = "stop_activities"

    id: Mapped[uuid.UUID] = mapped_column(GUID, primary_key=True, default=uuid.uuid4)
    stop_id: Mapped[uuid.UUID] = mapped_column(GUID, ForeignKey("stops.id", ondelete="CASCADE"), nullable=False)
    activity_id: Mapped[uuid.UUID] = mapped_column(GUID, ForeignKey("activities.id", ondelete="RESTRICT"), nullable=False)
    scheduled_date: Mapped[date] = mapped_column(Date, nullable=True)
    scheduled_time: Mapped[time] = mapped_column(Time, nullable=True)
    cost_override: Mapped[float] = mapped_column(Numeric(10, 2), nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Relationships
    stop: Mapped["Stop"] = relationship(back_populates="stop_activities")
    activity: Mapped["Activity"] = relationship(back_populates="stop_activities")
