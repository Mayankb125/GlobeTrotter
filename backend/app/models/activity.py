import uuid
from typing import List
from sqlalchemy import String, ForeignKey, Text, Numeric, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, GUID


class Activity(Base):
    __tablename__ = "activities"

    id: Mapped[uuid.UUID] = mapped_column(GUID, primary_key=True, default=uuid.uuid4)
    city_id: Mapped[uuid.UUID] = mapped_column(GUID, ForeignKey("cities.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)  # sightseeing, food, adventure, etc.
    cost_estimate: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0.00)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=True)
    image_url: Mapped[str] = mapped_column(String(255), nullable=True)

    # Relationships
    city: Mapped["City"] = relationship(back_populates="activities")
    stop_activities: Mapped[List["StopActivity"]] = relationship(
        back_populates="activity", cascade="all, delete-orphan"
    )
