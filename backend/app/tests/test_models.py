import pytest
import uuid
from datetime import date, datetime, time
from decimal import Decimal
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

from app.core.database import Base
from app.models.user import User
from app.models.city import City
from app.models.activity import Activity
from app.models.trip import Trip
from app.models.stop import Stop
from app.models.stop_activity import StopActivity
from app.models.budget_item import BudgetItem

# Setup async SQLite in-memory engine for unit testing database models
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(name="db_session")
async def fixture_db_session():
    """
    Async fixture initializing SQLite memory DB, creating all tables,
    and yielding an active database session for tests.
    """
    engine = create_async_engine(TEST_DATABASE_URL, echo=False, future=True)
    async_session = async_sessionmaker(
        bind=engine, class_=AsyncSession, expire_on_commit=False
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        yield session
        await session.rollback()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest.mark.asyncio
async def test_create_user(db_session: AsyncSession):
    # Create User
    new_user = User(
        name="John Doe",
        email="john@example.com",
        password_hash="hashed_password_value_123",
        profile_photo_url="https://example.com/john.jpg"
    )
    db_session.add(new_user)
    await db_session.commit()

    # Query User
    result = await db_session.execute(select(User).where(User.email == "john@example.com"))
    user = result.scalar_one_or_none()

    assert user is not None
    assert user.name == "John Doe"
    assert isinstance(user.id, uuid.UUID)
    assert isinstance(user.created_at, datetime)


@pytest.mark.asyncio
async def test_trip_stops_and_activities_flow(db_session: AsyncSession):
    # 1. Create User
    user = User(name="Alice", email="alice@example.com", password_hash="hash")
    db_session.add(user)

    # 2. Create City
    city = City(
        name="Jaipur",
        country="India",
        region="Rajasthan",
        cost_index=1.00,
        popularity_score=4.50,
        image_url="https://example.com/jaipur.jpg"
    )
    db_session.add(city)
    await db_session.flush()

    # 3. Create Activity inside City
    activity = Activity(
        city_id=city.id,
        name="Amber Fort Guided Tour",
        category="sightseeing",
        cost_estimate=Decimal("800.00"),
        duration_minutes=180
    )
    db_session.add(activity)

    # 4. Create Trip for User
    trip = Trip(
        user_id=user.id,
        name="Rajasthan Exploration",
        description="Exploring historic forts",
        start_date=date(2025, 12, 1),
        end_date=date(2025, 12, 5),
        is_public=True,
        share_token="xyz-token-abc"
    )
    db_session.add(trip)
    await db_session.flush()

    # 5. Create Stop inside Trip
    stop = Stop(
        trip_id=trip.id,
        city_id=city.id,
        start_date=date(2025, 12, 1),
        end_date=date(2025, 12, 3),
        order_index=0
    )
    db_session.add(stop)
    await db_session.flush()

    # 6. Schedule StopActivity
    stop_activity = StopActivity(
        stop_id=stop.id,
        activity_id=activity.id,
        scheduled_date=date(2025, 12, 2),
        scheduled_time=time(10, 0),
        cost_override=Decimal("750.00"),
        notes="Elephant ride optional",
        order_index=0
    )
    db_session.add(stop_activity)

    # 7. Add BudgetItem
    budget_item = BudgetItem(
        trip_id=trip.id,
        category="stay",
        amount=Decimal("4000.00"),
        currency="INR",
        description="Heritage stay booking"
    )
    db_session.add(budget_item)
    await db_session.commit()

    # --- VERIFY RELATIONSHIPS ---
    # Query Trip with stops and budget items eagerly loaded
    from sqlalchemy.orm import selectinload
    trip_result = await db_session.execute(
        select(Trip)
        .options(
            selectinload(Trip.stops).selectinload(Stop.city),
            selectinload(Trip.stops).selectinload(Stop.stop_activities).selectinload(StopActivity.activity),
            selectinload(Trip.budget_items)
        )
        .where(Trip.id == trip.id)
    )
    fetched_trip = trip_result.scalar_one_or_none()

    assert fetched_trip is not None
    assert len(fetched_trip.stops) == 1
    assert len(fetched_trip.budget_items) == 1
    assert fetched_trip.budget_items[0].category == "stay"
    assert fetched_trip.budget_items[0].amount == 4000.0

    # Query Stop details
    fetched_stop = fetched_trip.stops[0]
    assert fetched_stop.city.name == "Jaipur"
    assert len(fetched_stop.stop_activities) == 1

    # Query StopActivity details
    fetched_sa = fetched_stop.stop_activities[0]
    assert fetched_sa.activity.name == "Amber Fort Guided Tour"
    assert fetched_sa.cost_override == 750.0
    assert fetched_sa.notes == "Elephant ride optional"
