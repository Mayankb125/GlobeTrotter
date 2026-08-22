"""
Shared pytest fixtures for the GlobeTrotter test suite.

Uses an in-memory SQLite database (aiosqlite) so tests run without Postgres.
The FastAPI test client is built with httpx.AsyncClient + ASGITransport.
"""
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.core.database import Base, get_db
from app.main import app

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def db_session():
    """Yield a fresh async SQLite session with all tables created."""
    engine = create_async_engine(TEST_DB_URL, echo=False, future=True)
    SessionLocal = async_sessionmaker(
        bind=engine, class_=AsyncSession, expire_on_commit=False
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as session:
        yield session
        await session.rollback()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession):
    """
    Yield an httpx AsyncClient wired to the FastAPI app with the test DB session.
    The db_session fixture is shared so tests can seed data directly AND hit endpoints.
    """
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as ac:
        yield ac

    app.dependency_overrides.clear()
