"""
Share service.

Responsible for generating and managing share tokens on Trip records.
A share token is a URL-safe, cryptographically random string that grants
public, unauthenticated read access to a specific trip.

Also provides deep-clone (copy) functionality so any authenticated user can
fork a public shared trip into their own account.
"""
import secrets
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.stop import Stop
from app.models.stop_activity import StopActivity
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
    await db.refresh(trip)

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


async def copy_trip(
    token: str,
    new_owner_id: uuid.UUID,
    db: AsyncSession,
) -> Trip:
    """
    Deep-clone a public shared trip into `new_owner_id`'s account.

    Clones: Trip → Stops → StopActivities (preserving order_index, dates,
    cost_override, notes).  The new trip starts private (is_public=False,
    share_token=None) so the copy owner controls its visibility independently.
    The original trip is never modified.

    Returns the newly created Trip.
    Raises ValueError if the token is invalid / trip is not public.
    """
    # ------------------------------------------------------------------
    # 1. Resolve the original trip (must be public)
    # ------------------------------------------------------------------
    src_result = await db.execute(
        select(Trip)
        .options(
            selectinload(Trip.stops)
            .selectinload(Stop.stop_activities)
        )
        .where(Trip.share_token == token, Trip.is_public.is_(True))
    )
    source: Trip | None = src_result.scalars().first()

    if source is None:
        raise ValueError("Share link is invalid or has been revoked.")

    # ------------------------------------------------------------------
    # 2. Clone the Trip row (strip share fields, assign new owner)
    # ------------------------------------------------------------------
    new_trip = Trip(
        id=uuid.uuid4(),
        user_id=new_owner_id,
        name=f"{source.name} (copy)",
        description=source.description,
        start_date=source.start_date,
        end_date=source.end_date,
        cover_photo_url=source.cover_photo_url,
        budget_cap=source.budget_cap,
        is_public=False,
        share_token=None,
    )
    db.add(new_trip)
    await db.flush()  # get new_trip.id into the session

    # ------------------------------------------------------------------
    # 3. Clone each Stop and its StopActivities
    # ------------------------------------------------------------------
    for src_stop in sorted(source.stops, key=lambda s: s.order_index):
        new_stop = Stop(
            id=uuid.uuid4(),
            trip_id=new_trip.id,
            city_id=src_stop.city_id,
            start_date=src_stop.start_date,
            end_date=src_stop.end_date,
            order_index=src_stop.order_index,
        )
        db.add(new_stop)
        await db.flush()  # get new_stop.id

        for src_sa in sorted(src_stop.stop_activities, key=lambda a: a.order_index):
            new_sa = StopActivity(
                id=uuid.uuid4(),
                stop_id=new_stop.id,
                activity_id=src_sa.activity_id,
                scheduled_date=src_sa.scheduled_date,
                scheduled_time=src_sa.scheduled_time,
                cost_override=src_sa.cost_override,
                notes=src_sa.notes,
                order_index=src_sa.order_index,
            )
            db.add(new_sa)

    await db.flush()
    return new_trip
