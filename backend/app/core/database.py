import uuid
from typing import AsyncGenerator, Optional
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy.dialects.postgresql import UUID

from app.core.config import get_settings

settings = get_settings()

# Async Database Engine (with asyncpg driver support)
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True if settings.APP_ENV == "development" else False,
    future=True
)

# Async Session Factory
SessionLocal = async_sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    class_=AsyncSession,
    expire_on_commit=False
)


class Base(DeclarativeBase):
    """
    SQLAlchemy Declarative Base class.
    All database models should inherit from this class.
    """
    pass


class GUID(TypeDecorator):
    """
    Platform-independent GUID type.
    Uses PostgreSQL's UUID type if available, otherwise falls back to CHAR(32) in SQLite.
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(UUID())
        return dialect.type_descriptor(CHAR(32))

    def process_bind_param(self, value, dialect) -> Optional[str]:
        if value is None:
            return value
        if dialect.name == 'postgresql':
            return str(value)
        
        # Fallback to string representation for SQLite
        if isinstance(value, uuid.UUID):
            return value.hex
        try:
            return uuid.UUID(value).hex
        except ValueError:
            return value.replace('-', '')

    def process_result_value(self, value, dialect) -> Optional[uuid.UUID]:
        if value is None:
            return value
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(value)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency yielding an async database session.
    """
    async with SessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
