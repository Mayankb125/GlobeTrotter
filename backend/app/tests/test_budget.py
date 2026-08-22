"""
Phase 5.7 — Budget endpoint tests.

Covers:
- Add a manual budget item
- Delete a budget item
- GET /budget with only activities
- GET /budget with only manual items
- GET /budget with mixed items
- GET /budget on empty trip (returns zeros, not an error)
- is_over_budget flag when budget_cap is set
- Ownership checks
"""
import pytest
from decimal import Decimal
from httpx import AsyncClient

SIGNUP_URL = "/api/v1/auth/signup"
LOGIN_URL = "/api/v1/auth/login"
TRIPS_URL = "/api/v1/trips"

USER = {"name": "Budget Tester", "email": "budget@example-test.com", "password": "password123"}
USER_B = {"name": "Other User", "email": "other@example-test.com", "password": "password123"}

TRIP_PAYLOAD = {
    "name": "Budget Trip",
    "start_date": "2026-04-01",
    "end_date": "2026-04-10",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _login(client: AsyncClient, user: dict) -> str:
    await client.post(SIGNUP_URL, json=user)
    r = await client.post(LOGIN_URL, json={"email": user["email"], "password": user["password"]})
    return r.json()["access_token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def _create_trip(client, token, payload=None) -> str:
    r = await client.post(TRIPS_URL, json=payload or TRIP_PAYLOAD, headers=_auth(token))
    return r.json()["id"]


async def _add_item(client, token, trip_id, category="transport", amount="500.00") -> dict:
    r = await client.post(
        f"{TRIPS_URL}/{trip_id}/budget-items",
        json={"category": category, "amount": amount, "currency": "USD"},
        headers=_auth(token),
    )
    return r.json()


# ---------------------------------------------------------------------------
# Add / Delete budget items
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_add_budget_item(client: AsyncClient):
    token = await _login(client, USER)
    trip_id = await _create_trip(client, token)
    r = await client.post(
        f"{TRIPS_URL}/{trip_id}/budget-items",
        json={"category": "stay", "amount": "1200.00", "currency": "USD", "description": "Hotel"},
        headers=_auth(token),
    )
    assert r.status_code == 201
    body = r.json()
    assert body["category"] == "stay"
    assert float(body["amount"]) == 1200.0
    assert body["description"] == "Hotel"


@pytest.mark.asyncio
async def test_add_budget_item_unauthenticated(client: AsyncClient):
    token = await _login(client, USER)
    trip_id = await _create_trip(client, token)
    r = await client.post(
        f"{TRIPS_URL}/{trip_id}/budget-items",
        json={"category": "food", "amount": "50.00"},
    )
    assert r.status_code in (401, 403)


@pytest.mark.asyncio
async def test_delete_budget_item(client: AsyncClient):
    token = await _login(client, USER)
    trip_id = await _create_trip(client, token)
    item = await _add_item(client, token, trip_id)
    item_id = item["id"]

    r = await client.delete(f"/api/v1/budget-items/{item_id}", headers=_auth(token))
    assert r.status_code == 204

    # Should not appear in budget anymore
    budget = await client.get(f"{TRIPS_URL}/{trip_id}/budget", headers=_auth(token))
    assert budget.json()["grand_total"] == "0.00"


@pytest.mark.asyncio
async def test_delete_budget_item_ownership(client: AsyncClient):
    token_a = await _login(client, USER)
    token_b = await _login(client, USER_B)
    trip_id = await _create_trip(client, token_a)
    item = await _add_item(client, token_a, trip_id)

    r = await client.delete(f"/api/v1/budget-items/{item['id']}", headers=_auth(token_b))
    assert r.status_code in (403, 404)


# ---------------------------------------------------------------------------
# GET /budget — various states
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_budget_empty_trip(client: AsyncClient):
    """Empty trip should return zeros, not crash."""
    token = await _login(client, USER)
    trip_id = await _create_trip(client, token)
    r = await client.get(f"{TRIPS_URL}/{trip_id}/budget", headers=_auth(token))
    assert r.status_code == 200
    body = r.json()
    assert float(body["grand_total"]) == 0.0
    assert body["is_over_budget"] is None


@pytest.mark.asyncio
async def test_budget_manual_items_only(client: AsyncClient):
    token = await _login(client, USER)
    trip_id = await _create_trip(client, token)
    await _add_item(client, token, trip_id, "transport", "300.00")
    await _add_item(client, token, trip_id, "stay", "700.00")

    r = await client.get(f"{TRIPS_URL}/{trip_id}/budget", headers=_auth(token))
    assert r.status_code == 200
    body = r.json()
    assert float(body["grand_total"]) == 1000.0
    assert float(body["breakdown"]["transport"]["total"]) == 300.0
    assert float(body["breakdown"]["stay"]["total"]) == 700.0


@pytest.mark.asyncio
async def test_budget_activities_only(client: AsyncClient, db_session):
    """Activity costs flow into the activities bucket automatically."""
    from app.models.city import City
    from app.models.activity import Activity

    token = await _login(client, USER)
    trip_id = await _create_trip(client, token)

    city = City(name="Lisbon", country="Portugal")
    db_session.add(city)
    await db_session.flush()

    act = Activity(city_id=city.id, name="City Walk", category="sightseeing", cost_estimate=40)
    db_session.add(act)
    await db_session.flush()

    # Add stop then schedule the activity
    stop_r = await client.post(
        f"{TRIPS_URL}/{trip_id}/stops",
        json={"city_id": str(city.id), "start_date": "2026-04-01", "end_date": "2026-04-03"},
        headers=_auth(token),
    )
    stop_id = stop_r.json()["id"]
    await client.post(
        f"/api/v1/stops/{stop_id}/activities",
        json={"activity_id": str(act.id)},
        headers=_auth(token),
    )

    r = await client.get(f"{TRIPS_URL}/{trip_id}/budget", headers=_auth(token))
    assert r.status_code == 200
    body = r.json()
    assert float(body["breakdown"]["activities"]["activities_total"]) == 40.0
    assert float(body["grand_total"]) == 40.0


@pytest.mark.asyncio
async def test_budget_mixed(client: AsyncClient, db_session):
    from app.models.city import City
    from app.models.activity import Activity

    token = await _login(client, USER)
    trip_id = await _create_trip(client, token)

    city = City(name="Vienna", country="Austria")
    db_session.add(city)
    await db_session.flush()
    act = Activity(city_id=city.id, name="Opera Night", category="culture", cost_estimate=100)
    db_session.add(act)
    await db_session.flush()

    stop_r = await client.post(
        f"{TRIPS_URL}/{trip_id}/stops",
        json={"city_id": str(city.id), "start_date": "2026-04-01", "end_date": "2026-04-05"},
        headers=_auth(token),
    )
    stop_id = stop_r.json()["id"]
    await client.post(
        f"/api/v1/stops/{stop_id}/activities",
        json={"activity_id": str(act.id)},
        headers=_auth(token),
    )
    await _add_item(client, token, trip_id, "transport", "200.00")

    r = await client.get(f"{TRIPS_URL}/{trip_id}/budget", headers=_auth(token))
    body = r.json()
    assert float(body["grand_total"]) == 300.0


@pytest.mark.asyncio
async def test_budget_over_cap_flag(client: AsyncClient):
    token = await _login(client, USER)
    trip_id = await _create_trip(client, token, {**TRIP_PAYLOAD, "budget_cap": "500.00"})
    await _add_item(client, token, trip_id, "misc", "600.00")

    r = await client.get(f"{TRIPS_URL}/{trip_id}/budget", headers=_auth(token))
    body = r.json()
    assert body["is_over_budget"] is True
    assert float(body["budget_cap"]) == 500.0


@pytest.mark.asyncio
async def test_budget_under_cap_flag(client: AsyncClient):
    token = await _login(client, USER)
    trip_id = await _create_trip(client, token, {**TRIP_PAYLOAD, "budget_cap": "1000.00"})
    await _add_item(client, token, trip_id, "food", "300.00")

    r = await client.get(f"{TRIPS_URL}/{trip_id}/budget", headers=_auth(token))
    body = r.json()
    assert body["is_over_budget"] is False
