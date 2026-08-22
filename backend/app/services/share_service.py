"""
Share service.

Responsible for generating and managing share tokens on Trip records.
A share token is a URL-safe, cryptographically random string that grants
public, unauthenticated read access to a specific trip.
"""
import secrets
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.trip import Trip

# Token length in bytes — produces a 43-character URL-safe base64 string
# (32 bytes = 256 bits of entropy, which is well beyond brute-force range)
_TOKEN_BYTES = 32


def _generate_token() -> str:
    """Return a cryptographically secure, URL-safe random token string."""
    return secrets.token_urlsafe(_TOKEN_BYTES)


async def generate_share_token(
    trip_id: uuid.UUID,
    owner_id: uuid.UUID,
    db: AsyncSession,
) -> Trip:
    """
    Generate a new share token for a trip and persist it.

    - Verifies the trip exists and belongs to `owner_id`.
    - Generates a fresh token even if one already exists (rotation).
    - Sets `is_public = True` so the trip is visible via the share link.

    Returns the updated Trip instance.
    Raises ValueError if the trip is not found or does not belong to the owner.
    """
    result = await db.execute(select(Trip).where(Trip.id == trip_id))
    trip: Trip | None = result.scalars().first()

    if trip is None:
        raise ValueError(f"Trip {trip_id} not found.")
    if trip.user_id != owner_id:
        raise ValueError(f"Trip {trip_id} does not belong to user {owner_id}.")

    # Rotate token on every call (safe — old links stop working immediately)
    trip.share_token = _generate_token()
    trip.is_public = True

    db.add(trip)
    await db.flush()   # write to DB within the current transaction

    return trip


async def revoke_share_token(
    trip_id: uuid.UUID,
    owner_id: uuid.UUID,
    db: AsyncSession,
) -> Trip:
    """
    Clear the share token for a trip, making it private again.

    Returns the updated Trip instance.
    Raises ValueError if the trip is not found or does not belong to the owner.
    """
    result = await db.execute(select(Trip).where(Trip.id == trip_id))
    trip: Trip | None = result.scalars().first()

    if trip is None:
        raise ValueError(f"Trip {trip_id} not found.")
    if trip.user_id != owner_id:
        raise ValueError(f"Trip {trip_id} does not belong to user {owner_id}.")

    trip.share_token = None
    trip.is_public = False

    db.add(trip)
    await db.flush()

    return trip


async def get_trip_by_share_token(
    token: str,
    db: AsyncSession,
) -> Trip:
    """
    Fetch a trip by its share token for public, unauthenticated access.

    Returns the Trip instance.
    Raises ValueError if no active trip matches the token.
    """
    result = await db.execute(
        select(Trip).where(Trip.share_token == token, Trip.is_public.is_(True))
    )
    trip: Trip | None = result.scalars().first()

    if trip is None:
        raise ValueError("Share link is invalid or has been revoked.")

    return trip
