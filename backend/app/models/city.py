import uuid
from typing import List
from sqlalchemy import String, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, GUID


class City(Base):
    __tablename__ = "cities"

    id: Mapped[uuid.UUID] = mapped_column(GUID, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    country: Mapped[str] = mapped_column(String(100), nullable=False)
    region: Mapped[str] = mapped_column(String(100), nullable=True)
    cost_index: Mapped[float] = mapped_column(Numeric(10, 2), nullable=True, default=1.00)
    popularity_score: Mapped[float] = mapped_column(Numeric(10, 2), nullable=True, default=0.00)
    image_url: Mapped[str] = mapped_column(String(255), nullable=True)

    # Relationships
    activities: Mapped[List["Activity"]] = relationship(
        back_populates="city", cascade="all, delete-orphan"
    )
    stops: Mapped[List["Stop"]] = relationship(
        back_populates="city"
    )
