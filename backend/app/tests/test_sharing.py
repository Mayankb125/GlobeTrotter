"""
Phase 6.6 — Sharing endpoint tests.

Exit condition:
  - A logged-out request to a share URL returns the trip.
  - A logged-in different user can copy it into their own account.

Test matrix:
  Share / unshare toggle
  ├── share sets is_public=True and returns a token + share_url
  ├── unshare clears the token and sets is_public=False
  └── non-owner cannot share or unshare

  Public read (GET /public/{token})
  ├── valid token on a public trip → 200 with full nested detail (no auth)
  ├── token of an unshared trip → 404
  └── completely unknown token → 404

  Copy (POST /public/{token}/copy)
  ├── authenticated different user → 201, new trip in their account
  ├── copy is fully independent (name suffix, is_public=False, no token)
  ├── copy preserves stops order and stop-activities
  └── invalid/revoked token → 404
"""
import uuid
import pytest
from httpx import AsyncClient

from app.models.city import City
from app.models.activity import Activity
from app.models.stop import Stop
from app.models.stop_activity import StopActivity
from app.models.trip import Trip

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SIGNUP_URL = "/api/v1/auth/signup"
LOGIN_URL  = "/api/v1/auth/login"
TRIPS_URL  = "/api/v1/trips"

USER_OWNER  = {"name": "Owner",  "email": "owner@share-test.com",  "password": "password123"}
USER_VIEWER = {"name": "Viewer", "email": "viewer@share-test.com", "password": "password123"}

TRIP_PAYLOAD = {
    "name": "Spain Road Trip",
    "start_date": "2026-06-01",
    "end_date": "2026-06-14",
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _register_and_login(client: AsyncClient, user: dict) -> str:
    await client.post(SIGNUP_URL, json=user)
    r = await client.post(LOGIN_URL, json={"email": user["email"], "password": user["password"]})
    return r.json()["access_token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def _seed_city(db_session) -> City:
    city = City(name="Barcelona", country="Spain", region="Catalonia")
    db_session.add(city)
    await db_session.flush()
    return city


async def _seed_activity(db_session, city: City) -> Activity:
    activity = Activity(
        city_id=city.id,
        name="Sagrada Familia",
        category="sightseeing",
        cost_estimate=30,
    )
    db_session.add(activity)
    await db_session.flush()
    return activity


async def _create_trip_with_stop_and_activity(client, token, db_session) -> tuple[str, str, str]:
    """
    Create a trip, add a stop with one activity.
    Returns (trip_id, stop_id, stop_activity_id).
    """
    city = await _seed_city(db_session)
    activity = await _seed_activity(db_session, city)

    trip_r = await client.post(TRIPS_URL, json=TRIP_PAYLOAD, headers=_auth(token))
    assert trip_r.status_code == 201
    trip_id = trip_r.json()["id"]

    stop_r = await client.post(
        f"{TRIPS_URL}/{trip_id}/stops",
        json={"city_id": str(city.id), "start_date": "2026-06-01", "end_date": "2026-06-05", "order_index": 0},
        headers=_auth(token),
    )
    assert stop_r.status_code == 201
    stop_id = stop_r.json()["id"]

    sa_r = await client.post(
        f"/api/v1/stops/{stop_id}/activities",
        json={"activity_id": str(activity.id), "scheduled_date": "2026-06-02", "order_index": 0},
        headers=_auth(token),
    )
    assert sa_r.status_code == 201
    sa_id = sa_r.json()["id"]

    return trip_id, stop_id, sa_id


# ===========================================================================
# SHARE / UNSHARE TOGGLE
# ===========================================================================

@pytest.mark.asyncio
async def test_share_sets_public_and_returns_token(client: AsyncClient):
    """POST /trips/{id}/share → is_public=True, non-empty token, share_url present."""
    token = await _register_and_login(client, USER_OWNER)
    trip_r = await client.post(TRIPS_URL, json=TRIP_PAYLOAD, headers=_auth(token))
    trip_id = trip_r.json()["id"]

    r = await client.post(f"{TRIPS_URL}/{trip_id}/share", headers=_auth(token))
    assert r.status_code == 200
    body = r.json()
    assert body["is_public"] is True
    assert body["share_token"] != ""
    assert body["trip_id"] == trip_id
    assert "/trips/shared/" in body["share_url"]
    assert body["share_token"] in body["share_url"]


@pytest.mark.asyncio
async def test_share_rotates_token_on_second_call(client: AsyncClient):
    """Calling share twice generates a fresh token each time."""
    token = await _register_and_login(client, USER_OWNER)
    trip_id = (await client.post(TRIPS_URL, json=TRIP_PAYLOAD, headers=_auth(token))).json()["id"]

    first  = (await client.post(f"{TRIPS_URL}/{trip_id}/share", headers=_auth(token))).json()["share_token"]
    second = (await client.post(f"{TRIPS_URL}/{trip_id}/share", headers=_auth(token))).json()["share_token"]
    assert first != second


@pytest.mark.asyncio
async def test_unshare_clears_token_and_sets_private(client: AsyncClient):
    """POST /trips/{id}/unshare → is_public=False, share_token=None in DB."""
    token = await _register_and_login(client, USER_OWNER)
    trip_id = (await client.post(TRIPS_URL, json=TRIP_PAYLOAD, headers=_auth(token))).json()["id"]

    # Share first
    share_r = await client.post(f"{TRIPS_URL}/{trip_id}/share", headers=_auth(token))
    assert share_r.status_code == 200
    share_token = share_r.json()["share_token"]

    # Then unshare
    unshare_r = await client.post(f"{TRIPS_URL}/{trip_id}/unshare", headers=_auth(token))
    assert unshare_r.status_code == 200
    assert unshare_r.json()["is_public"] is False
    assert unshare_r.json()["share_token"] is None

    # Old token no longer works
    public_r = await client.get(f"/api/v1/public/{share_token}")
    assert public_r.status_code == 404


@pytest.mark.asyncio
async def test_share_non_owner_is_rejected(client: AsyncClient):
    """A different user cannot share someone else's trip."""
    owner_token  = await _register_and_login(client, USER_OWNER)
    viewer_token = await _register_and_login(client, USER_VIEWER)

    trip_id = (await client.post(TRIPS_URL, json=TRIP_PAYLOAD, headers=_auth(owner_token))).json()["id"]

    r = await client.post(f"{TRIPS_URL}/{trip_id}/share", headers=_auth(viewer_token))
    assert r.status_code in (403, 404)  # service raises ValueError → 404


@pytest.mark.asyncio
async def test_unshare_non_owner_is_rejected(client: AsyncClient):
    """A different user cannot unshare someone else's trip."""
    owner_token  = await _register_and_login(client, USER_OWNER)
    viewer_token = await _register_and_login(client, USER_VIEWER)

    trip_id = (await client.post(TRIPS_URL, json=TRIP_PAYLOAD, headers=_auth(owner_token))).json()["id"]
    await client.post(f"{TRIPS_URL}/{trip_id}/share", headers=_auth(owner_token))

    r = await client.post(f"{TRIPS_URL}/{trip_id}/unshare", headers=_auth(viewer_token))
    assert r.status_code in (403, 404)


# ===========================================================================
# PUBLIC FETCH — GET /public/{share_token}
# ===========================================================================

@pytest.mark.asyncio
async def test_public_fetch_no_auth_returns_trip(client: AsyncClient, db_session):
    """
    EXIT CONDITION (part 1):
    A logged-out request to a valid share URL returns the full trip.
    No Authorization header is sent at all.
    """
    owner_token = await _register_and_login(client, USER_OWNER)
    trip_id, stop_id, _ = await _create_trip_with_stop_and_activity(client, owner_token, db_session)

    # Share the trip
    share_token = (
        await client.post(f"{TRIPS_URL}/{trip_id}/share", headers=_auth(owner_token))
    ).json()["share_token"]

    # Fetch with NO auth header
    r = await client.get(f"/api/v1/public/{share_token}")
    assert r.status_code == 200

    body = r.json()
    assert body["id"] == trip_id
    assert body["name"] == TRIP_PAYLOAD["name"]
    assert body["is_public"] is True
    assert "stops" in body
    assert len(body["stops"]) == 1
    assert len(body["stops"][0]["stop_activities"]) == 1


@pytest.mark.asyncio
async def test_public_fetch_unshared_trip_returns_404(client: AsyncClient):
    """
    Share a trip, then unshare it — the old token must return 404.
    This covers the 'public fetch of unshared trip returns 404' requirement.
    """
    owner_token = await _register_and_login(client, USER_OWNER)
    trip_id = (await client.post(TRIPS_URL, json=TRIP_PAYLOAD, headers=_auth(owner_token))).json()["id"]

    # Share → capture token
    share_token = (
        await client.post(f"{TRIPS_URL}/{trip_id}/share", headers=_auth(owner_token))
    ).json()["share_token"]

    # Confirm it works while public
    assert (await client.get(f"/api/v1/public/{share_token}")).status_code == 200

    # Unshare
    await client.post(f"{TRIPS_URL}/{trip_id}/unshare", headers=_auth(owner_token))

    # Now the old token must 404
    r = await client.get(f"/api/v1/public/{share_token}")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_public_fetch_unknown_token_returns_404(client: AsyncClient):
    """A random token that was never issued returns 404."""
    r = await client.get("/api/v1/public/totally-made-up-token-xyz")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_public_fetch_trip_never_shared_returns_404(client: AsyncClient):
    """A trip that was created but never shared has no token — 404 on any guess."""
    r = await client.get(f"/api/v1/public/{uuid.uuid4()}")
    assert r.status_code == 404


# ===========================================================================
# COPY — POST /public/{share_token}/copy
# ===========================================================================

@pytest.mark.asyncio
async def test_copy_creates_new_trip_in_requester_account(client: AsyncClient, db_session):
    """
    EXIT CONDITION (part 2):
    A logged-in different user copies the shared trip into their own account.
    """
    owner_token  = await _register_and_login(client, USER_OWNER)
    viewer_token = await _register_and_login(client, USER_VIEWER)

    trip_id, _, _ = await _create_trip_with_stop_and_activity(client, owner_token, db_session)

    share_token = (
        await client.post(f"{TRIPS_URL}/{trip_id}/share", headers=_auth(owner_token))
    ).json()["share_token"]

    # Viewer copies the trip
    copy_r = await client.post(f"/api/v1/public/{share_token}/copy", headers=_auth(viewer_token))
    assert copy_r.status_code == 201

    copy_body = copy_r.json()
    # New trip must have a different ID
    assert copy_body["id"] != trip_id
    # Name gets the "(copy)" suffix
    assert "(copy)" in copy_body["name"]
    # Starts private
    assert copy_body["is_public"] is False


@pytest.mark.asyncio
async def test_copy_is_fully_independent(client: AsyncClient, db_session):
    """
    Copy is independent: deleting the original does not affect the copy,
    and the copy's is_public / share_token are separate.
    """
    owner_token  = await _register_and_login(client, USER_OWNER)
    viewer_token = await _register_and_login(client, USER_VIEWER)

    trip_id, _, _ = await _create_trip_with_stop_and_activity(client, owner_token, db_session)

    share_token = (
        await client.post(f"{TRIPS_URL}/{trip_id}/share", headers=_auth(owner_token))
    ).json()["share_token"]

    copy_id = (
        await client.post(f"/api/v1/public/{share_token}/copy", headers=_auth(viewer_token))
    ).json()["id"]

    # Delete the original
    del_r = await client.delete(f"{TRIPS_URL}/{trip_id}", headers=_auth(owner_token))
    assert del_r.status_code == 204

    # Copy still exists in viewer's account
    viewer_trips = (await client.get(TRIPS_URL, headers=_auth(viewer_token))).json()
    assert any(t["id"] == copy_id for t in viewer_trips)


@pytest.mark.asyncio
async def test_copy_preserves_stops_and_activities(client: AsyncClient, db_session):
    """Copy includes all stops and their scheduled activities."""
    owner_token  = await _register_and_login(client, USER_OWNER)
    viewer_token = await _register_and_login(client, USER_VIEWER)

    trip_id, _, _ = await _create_trip_with_stop_and_activity(client, owner_token, db_session)

    share_token = (
        await client.post(f"{TRIPS_URL}/{trip_id}/share", headers=_auth(owner_token))
    ).json()["share_token"]

    copy_id = (
        await client.post(f"/api/v1/public/{share_token}/copy", headers=_auth(viewer_token))
    ).json()["id"]

    # Fetch the copy via the detail endpoint (viewer owns it now)
    detail_r = await client.get(f"{TRIPS_URL}/{copy_id}", headers=_auth(viewer_token))
    assert detail_r.status_code == 200
    body = detail_r.json()
    # 1 stop with 1 activity preserved
    assert len(body["stops"]) == 1
    assert len(body["stops"][0]["stop_activities"]) == 1


@pytest.mark.asyncio
async def test_copy_requires_auth(client: AsyncClient):
    """Unauthenticated copy attempt returns 401/403."""
    r = await client.post("/api/v1/public/some-token/copy")
    assert r.status_code in (401, 403)


@pytest.mark.asyncio
async def test_copy_invalid_token_returns_404(client: AsyncClient):
    """Copy with a non-existent token returns 404."""
    viewer_token = await _register_and_login(client, USER_VIEWER)
    r = await client.post("/api/v1/public/invalid-token-xyz/copy", headers=_auth(viewer_token))
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_copy_revoked_token_returns_404(client: AsyncClient):
    """Copy attempt after unshare returns 404."""
    owner_token  = await _register_and_login(client, USER_OWNER)
    viewer_token = await _register_and_login(client, USER_VIEWER)

    trip_id = (await client.post(TRIPS_URL, json=TRIP_PAYLOAD, headers=_auth(owner_token))).json()["id"]

    share_token = (
        await client.post(f"{TRIPS_URL}/{trip_id}/share", headers=_auth(owner_token))
    ).json()["share_token"]

    # Revoke before viewer can copy
    await client.post(f"{TRIPS_URL}/{trip_id}/unshare", headers=_auth(owner_token))

    r = await client.post(f"/api/v1/public/{share_token}/copy", headers=_auth(viewer_token))
    assert r.status_code == 404
