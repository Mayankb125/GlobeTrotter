"""
Phase 7.5 — AI-assist endpoint tests.

Strategy
────────
All tests mock `app.ai.planner.generate_itinerary` so no real API calls are
made.  Three scenarios are exercised:

  1. Successful generation  — planner returns a well-formed itinerary dict.
     Asserts: 200, correct counts, DB rows actually exist, trip detail shows stops.

  2. Missing-key graceful failure  — planner returns the stub/fallback response
     (special_notes contains "fallback mode").
     Asserts: still 200 (not an error), ai_degraded=true.

  3. Malformed LLM JSON fallback  — planner returns a dict with no
     daily_schedule key at all, simulating a completely broken response.
     Asserts: 503 with AIAssistUnavailable detail body.

  4. Bonus: non-owner cannot run ai-assist (403/404).
  5. Bonus: unauthenticated call returns 401/403.
"""
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient

# ---------------------------------------------------------------------------
# Shared constants (mirror test_trips.py style)
# ---------------------------------------------------------------------------

SIGNUP_URL = "/api/v1/auth/signup"
LOGIN_URL  = "/api/v1/auth/login"
TRIPS_URL  = "/api/v1/trips"
AI_ASSIST_PATH = "/ai-assist"   # appended to /trips/{id}

USER_OWNER  = {"name": "AiOwner",  "email": "ai-owner@test.com",  "password": "password123"}
USER_OTHER  = {"name": "AiOther",  "email": "ai-other@test.com",  "password": "password123"}

TRIP_PAYLOAD = {
    "name": "AI Test Trip",
    "start_date": "2026-09-01",
    "end_date": "2026-09-05",
}

AI_REQUEST = {
    "destination": "Jaipur",
    "home_location": "Delhi",
    "budget_min": 5000,
    "budget_max": 30000,
    "travel_style": "balanced",
    "interests": ["history", "food"],
    "dietary_restrictions": [],
    "currency": "INR",
}

# ---------------------------------------------------------------------------
# Canonical well-formed planner response (2 days, 2 activities each)
# ---------------------------------------------------------------------------

GOOD_ITINERARY = {
    "destination": "Jaipur",
    "duration_days": 2,
    "accommodation": {
        "name": "Pink City Hotel",
        "cost_per_night": 3000,
        "total_nights": 1,
        "total_cost": 3000,
        "recommendation": "Central location.",
    },
    "daily_schedule": [
        {
            "day": 1,
            "date": "September 01, 2026",
            "activities": [
                {
                    "time": "09:00 AM - 12:00 PM",
                    "name": "Amber Fort",
                    "description": "Historic hilltop fort.",
                    "location": "Amer, Jaipur",
                    "cost": 500,
                    "transportation": "Taxi",
                },
                {
                    "time": "02:00 PM - 05:00 PM",
                    "name": "Hawa Mahal",
                    "description": "Palace of winds.",
                    "location": "Old City, Jaipur",
                    "cost": 200,
                    "transportation": "Auto-rickshaw",
                },
            ],
            "meals": [{"time": "lunch", "restaurant": "Lassiwala", "cuisine": "Rajasthani", "estimated_cost": 400}],
            "total_day_cost": 1100,
        },
        {
            "day": 2,
            "date": "September 02, 2026",
            "activities": [
                {
                    "time": "10:00 AM - 01:00 PM",
                    "name": "City Palace",
                    "description": "Royal palace complex.",
                    "location": "Tripolia Bazaar, Jaipur",
                    "cost": 400,
                    "transportation": "Walking",
                },
                {
                    "time": "03:00 PM - 05:00 PM",
                    "name": "Jantar Mantar",
                    "description": "Astronomical observatory.",
                    "location": "Near City Palace, Jaipur",
                    "cost": 200,
                    "transportation": "Walking",
                },
            ],
            "meals": [{"time": "lunch", "restaurant": "Chokhi Dhani", "cuisine": "Rajasthani", "estimated_cost": 600}],
            "total_day_cost": 1200,
        },
    ],
    "transportation": {
        "to_destination": {"method": "Train", "cost": 800, "duration": "5 hours"},
        "local": "Auto-rickshaw",
        "estimated_local_cost": 600,
    },
    "cost_breakdown": {
        "accommodation": 3000,
        "activities": 1300,
        "food": 1000,
        "transportation": 1400,
        "miscellaneous": 500,
        "total": 7200,
        "currency": "INR",
    },
    "special_notes": "Carry cash for smaller establishments.",
}

# Fallback/stub response — special_notes reveals it
FALLBACK_ITINERARY = {**GOOD_ITINERARY, "special_notes": "Itinerary created in fallback mode."}

# Completely broken — no daily_schedule
BROKEN_ITINERARY: dict = {
    "destination": "Jaipur",
    "cost_breakdown": {},
    # no "daily_schedule" key at all
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


async def _create_trip(client: AsyncClient, token: str) -> str:
    r = await client.post(TRIPS_URL, json=TRIP_PAYLOAD, headers=_auth(token))
    assert r.status_code == 201
    return r.json()["id"]


# ===========================================================================
# 1 — Successful generation (mocked)
# ===========================================================================

@pytest.mark.asyncio
async def test_ai_assist_success(client: AsyncClient):
    """
    Happy path: planner returns a well-formed itinerary.
    Asserts 200, correct creation counts, and ai_degraded=False.
    """
    token = await _register_and_login(client, USER_OWNER)
    trip_id = await _create_trip(client, token)

    with patch(
        "app.services.ai_assist_service.generate_itinerary",
        new=AsyncMock(return_value=GOOD_ITINERARY),
    ):
        r = await client.post(
            f"{TRIPS_URL}/{trip_id}{AI_ASSIST_PATH}",
            json=AI_REQUEST,
            headers=_auth(token),
        )

    assert r.status_code == 200, r.text
    body = r.json()
    assert body["trip_id"] == trip_id
    assert body["destination"] == "Jaipur"
    # 2 days → 2 stops
    assert body["stops_created"] == 2
    # 2 activities per day → 4 stop-activities
    assert body["activities_created"] == 4
    # 5 non-zero budget categories
    assert body["budget_items_created"] == 5
    assert body["ai_degraded"] is False
    assert body["special_notes"] == "Carry cash for smaller establishments."


@pytest.mark.asyncio
async def test_ai_assist_creates_db_rows(client: AsyncClient):
    """
    After a successful ai-assist call, GET /trips/{id} must return
    the newly created stops (trip detail shows them).
    """
    token = await _register_and_login(client, USER_OWNER)
    trip_id = await _create_trip(client, token)

    with patch(
        "app.services.ai_assist_service.generate_itinerary",
        new=AsyncMock(return_value=GOOD_ITINERARY),
    ):
        await client.post(
            f"{TRIPS_URL}/{trip_id}{AI_ASSIST_PATH}",
            json=AI_REQUEST,
            headers=_auth(token),
        )

    # Fetch the trip detail and verify stops are present
    detail_r = await client.get(f"{TRIPS_URL}/{trip_id}", headers=_auth(token))
    assert detail_r.status_code == 200
    body = detail_r.json()
    assert len(body["stops"]) == 2
    # Each stop must have stop_activities
    total_sa = sum(len(s["stop_activities"]) for s in body["stops"])
    assert total_sa == 4


@pytest.mark.asyncio
async def test_ai_assist_days_draft_in_response(client: AsyncClient):
    """Response includes the raw LLM day-by-day draft for UI preview."""
    token = await _register_and_login(client, USER_OWNER)
    trip_id = await _create_trip(client, token)

    with patch(
        "app.services.ai_assist_service.generate_itinerary",
        new=AsyncMock(return_value=GOOD_ITINERARY),
    ):
        r = await client.post(
            f"{TRIPS_URL}/{trip_id}{AI_ASSIST_PATH}",
            json=AI_REQUEST,
            headers=_auth(token),
        )

    body = r.json()
    assert len(body["days_draft"]) == 2
    assert body["days_draft"][0]["day"] == 1
    assert len(body["days_draft"][0]["activities"]) == 2
    assert body["days_draft"][0]["activities"][0]["name"] == "Amber Fort"
    # Budget draft mirrors cost_breakdown
    assert body["budget_draft"]["total"] == "7200"
    assert body["budget_draft"]["currency"] == "INR"


# ===========================================================================
# 2 — Missing-key graceful failure (stub/fallback response)
# ===========================================================================

@pytest.mark.asyncio
async def test_ai_assist_missing_key_returns_degraded(client: AsyncClient):
    """
    When the planner returns a fallback (stub) response due to missing API
    keys, the endpoint must still return 200 with ai_degraded=True.
    """
    token = await _register_and_login(client, USER_OWNER)
    trip_id = await _create_trip(client, token)

    with patch(
        "app.services.ai_assist_service.generate_itinerary",
        new=AsyncMock(return_value=FALLBACK_ITINERARY),
    ):
        r = await client.post(
            f"{TRIPS_URL}/{trip_id}{AI_ASSIST_PATH}",
            json=AI_REQUEST,
            headers=_auth(token),
        )

    assert r.status_code == 200, r.text
    body = r.json()
    # Flag must be set
    assert body["ai_degraded"] is True
    # But rows were still created
    assert body["stops_created"] > 0
    assert body["activities_created"] > 0


@pytest.mark.asyncio
async def test_ai_assist_api_exception_raises_degraded(client: AsyncClient):
    """
    If the planner raises an unexpected exception (network failure, etc.)
    the endpoint returns 503 with AIAssistUnavailable detail.
    """
    token = await _register_and_login(client, USER_OWNER)
    trip_id = await _create_trip(client, token)

    with patch(
        "app.services.ai_assist_service.generate_itinerary",
        new=AsyncMock(side_effect=RuntimeError("Groq network timeout")),
    ):
        r = await client.post(
            f"{TRIPS_URL}/{trip_id}{AI_ASSIST_PATH}",
            json=AI_REQUEST,
            headers=_auth(token),
        )

    assert r.status_code == 503
    body = r.json()
    assert body["detail"]["error"] == "ai_unavailable"
    assert body["detail"]["degraded"] is True


# ===========================================================================
# 3 — Malformed LLM JSON fallback (no daily_schedule)
# ===========================================================================

@pytest.mark.asyncio
async def test_ai_assist_malformed_json_returns_503(client: AsyncClient):
    """
    If the planner returns a dict with no daily_schedule at all (completely
    broken response), the endpoint must return 503 — not 500 — with a clean
    AIAssistUnavailable body.
    """
    token = await _register_and_login(client, USER_OWNER)
    trip_id = await _create_trip(client, token)

    with patch(
        "app.services.ai_assist_service.generate_itinerary",
        new=AsyncMock(return_value=BROKEN_ITINERARY),
    ):
        r = await client.post(
            f"{TRIPS_URL}/{trip_id}{AI_ASSIST_PATH}",
            json=AI_REQUEST,
            headers=_auth(token),
        )

    assert r.status_code == 503, r.text
    body = r.json()
    # Must be a structured error, not a raw traceback
    assert "detail" in body
    assert body["detail"]["error"] == "ai_unavailable"
    assert body["detail"]["degraded"] is True
    # The message must mention daily_schedule or unavailable — not a Python error
    assert "daily_schedule" in body["detail"]["message"] or "unavailable" in body["detail"]["message"].lower()


@pytest.mark.asyncio
async def test_ai_assist_empty_daily_schedule_returns_503(client: AsyncClient):
    """Empty list for daily_schedule is also unrecoverable → 503."""
    token = await _register_and_login(client, USER_OWNER)
    trip_id = await _create_trip(client, token)

    empty_schedule = {**GOOD_ITINERARY, "daily_schedule": []}

    with patch(
        "app.services.ai_assist_service.generate_itinerary",
        new=AsyncMock(return_value=empty_schedule),
    ):
        r = await client.post(
            f"{TRIPS_URL}/{trip_id}{AI_ASSIST_PATH}",
            json=AI_REQUEST,
            headers=_auth(token),
        )

    assert r.status_code == 503


# ===========================================================================
# 4 — Ownership and auth guards
# ===========================================================================

@pytest.mark.asyncio
async def test_ai_assist_non_owner_rejected(client: AsyncClient):
    """A different authenticated user cannot run ai-assist on someone else's trip."""
    owner_token = await _register_and_login(client, USER_OWNER)
    other_token = await _register_and_login(client, USER_OTHER)
    trip_id = await _create_trip(client, owner_token)

    with patch(
        "app.services.ai_assist_service.generate_itinerary",
        new=AsyncMock(return_value=GOOD_ITINERARY),
    ):
        r = await client.post(
            f"{TRIPS_URL}/{trip_id}{AI_ASSIST_PATH}",
            json=AI_REQUEST,
            headers=_auth(other_token),
        )

    assert r.status_code in (403, 404)


@pytest.mark.asyncio
async def test_ai_assist_unauthenticated_rejected(client: AsyncClient):
    """No auth header → 401/403."""
    token = await _register_and_login(client, USER_OWNER)
    trip_id = await _create_trip(client, token)

    r = await client.post(
        f"{TRIPS_URL}/{trip_id}{AI_ASSIST_PATH}",
        json=AI_REQUEST,
    )
    assert r.status_code in (401, 403)


@pytest.mark.asyncio
async def test_ai_assist_unknown_trip_returns_404(client: AsyncClient):
    """Calling ai-assist on a non-existent trip returns 404."""
    import uuid
    token = await _register_and_login(client, USER_OWNER)

    with patch(
        "app.services.ai_assist_service.generate_itinerary",
        new=AsyncMock(return_value=GOOD_ITINERARY),
    ):
        r = await client.post(
            f"{TRIPS_URL}/{uuid.uuid4()}{AI_ASSIST_PATH}",
            json=AI_REQUEST,
            headers=_auth(token),
        )

    assert r.status_code == 404


# ===========================================================================
# 5 — Exit condition: empty trip gets populated with editable itinerary
# ===========================================================================

@pytest.mark.asyncio
async def test_exit_condition_empty_trip_becomes_populated(client: AsyncClient):
    """
    EXIT CONDITION:
    An empty trip (zero stops) after one ai-assist call has real, editable
    Stop rows that can be updated via the normal CRUD endpoints.
    """
    token = await _register_and_login(client, USER_OWNER)
    trip_id = await _create_trip(client, token)

    # Confirm trip starts empty
    detail_before = (await client.get(f"{TRIPS_URL}/{trip_id}", headers=_auth(token))).json()
    assert len(detail_before["stops"]) == 0

    # Run ai-assist
    with patch(
        "app.services.ai_assist_service.generate_itinerary",
        new=AsyncMock(return_value=GOOD_ITINERARY),
    ):
        r = await client.post(
            f"{TRIPS_URL}/{trip_id}{AI_ASSIST_PATH}",
            json=AI_REQUEST,
            headers=_auth(token),
        )
    assert r.status_code == 200

    # Trip now has stops
    detail_after = (await client.get(f"{TRIPS_URL}/{trip_id}", headers=_auth(token))).json()
    assert len(detail_after["stops"]) == 2

    # Each stop is editable via PUT /stops/{id}
    first_stop_id = detail_after["stops"][0]["id"]
    edit_r = await client.put(
        f"/api/v1/stops/{first_stop_id}",
        json={"end_date": "2026-09-03"},
        headers=_auth(token),
    )
    assert edit_r.status_code == 200
    assert edit_r.json()["end_date"] == "2026-09-03"
