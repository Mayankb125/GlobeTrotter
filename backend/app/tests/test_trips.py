"""
Phase 4.13 — Core trip/stop/activity endpoint tests.

Covers happy-path and auth/ownership failure cases for every endpoint
introduced in Phase 4.
"""
import uuid
import pytest
from httpx import AsyncClient

# ---------------------------------------------------------------------------
# Shared constants
# ---------------------------------------------------------------------------

SIGNUP_URL = "/api/v1/auth/signup"
LOGIN_URL = "/api/v1/auth/login"
TRIPS_URL = "/api/v1/trips"
CITIES_URL = "/api/v1/cities"
ACTIVITIES_URL = "/api/v1/activities"

USER_A = {"name": "Alice", "email": "alice@example-trips.com", "password": "password123"}
USER_B = {"name": "Bob",   "email": "bob@example-trips.com",   "password": "password123"}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _register_and_login(client: AsyncClient, user: dict) -> str:
    await client.post(SIGNUP_URL, json=user)
    r = await client.post(LOGIN_URL, json={"email": user["email"], "password": user["password"]})
    return r.json()["access_token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


TRIP_PAYLOAD = {
    "name": "Japan Adventure",
    "description": "Two weeks in Japan",
    "start_date": "2026-03-01",
    "end_date": "2026-03-15",
}


# ---------------------------------------------------------------------------
# Trip CRUD
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_create_trip(client: AsyncClient):
    token = await _register_and_login(client, USER_A)
    r = await client.post(TRIPS_URL, json=TRIP_PAYLOAD, headers=_auth(token))
    assert r.status_code == 201
    body = r.json()
    assert body["name"] == "Japan Adventure"
    assert "id" in body


@pytest.mark.asyncio
async def test_create_trip_unauthenticated(client: AsyncClient):
    r = await client.post(TRIPS_URL, json=TRIP_PAYLOAD)
    assert r.status_code in (401, 403)


@pytest.mark.asyncio
async def test_create_trip_invalid_dates(client: AsyncClient):
    token = await _register_and_login(client, USER_A)
    bad = {**TRIP_PAYLOAD, "start_date": "2026-03-15", "end_date": "2026-03-01"}
    r = await client.post(TRIPS_URL, json=bad, headers=_auth(token))
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_list_trips(client: AsyncClient):
    token = await _register_and_login(client, USER_A)
    await client.post(TRIPS_URL, json=TRIP_PAYLOAD, headers=_auth(token))
    r = await client.get(TRIPS_URL, headers=_auth(token))
    assert r.status_code == 200
    assert len(r.json()) >= 1


@pytest.mark.asyncio
async def test_list_trips_only_own(client: AsyncClient):
    token_a = await _register_and_login(client, USER_A)
    token_b = await _register_and_login(client, USER_B)
    await client.post(TRIPS_URL, json=TRIP_PAYLOAD, headers=_auth(token_a))
    r = await client.get(TRIPS_URL, headers=_auth(token_b))
    assert r.status_code == 200
    assert len(r.json()) == 0  # Bob sees none of Alice's trips


@pytest.mark.asyncio
async def test_get_trip_detail(client: AsyncClient):
    token = await _register_and_login(client, USER_A)
    create_r = await client.post(TRIPS_URL, json=TRIP_PAYLOAD, headers=_auth(token))
    trip_id = create_r.json()["id"]
    r = await client.get(f"{TRIPS_URL}/{trip_id}", headers=_auth(token))
    assert r.status_code == 200
    assert r.json()["id"] == trip_id
    assert "stops" in r.json()


@pytest.mark.asyncio
async def test_get_trip_ownership(client: AsyncClient):
    token_a = await _register_and_login(client, USER_A)
    token_b = await _register_and_login(client, USER_B)
    create_r = await client.post(TRIPS_URL, json=TRIP_PAYLOAD, headers=_auth(token_a))
    trip_id = create_r.json()["id"]
    r = await client.get(f"{TRIPS_URL}/{trip_id}", headers=_auth(token_b))
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_delete_trip(client: AsyncClient):
    token = await _register_and_login(client, USER_A)
    create_r = await client.post(TRIPS_URL, json=TRIP_PAYLOAD, headers=_auth(token))
    trip_id = create_r.json()["id"]
    r = await client.delete(f"{TRIPS_URL}/{trip_id}", headers=_auth(token))
    assert r.status_code == 204
    r2 = await client.get(f"{TRIPS_URL}/{trip_id}", headers=_auth(token))
    assert r2.status_code == 404


@pytest.mark.asyncio
async def test_delete_trip_ownership(client: AsyncClient):
    token_a = await _register_and_login(client, USER_A)
    token_b = await _register_and_login(client, USER_B)
    create_r = await client.post(TRIPS_URL, json=TRIP_PAYLOAD, headers=_auth(token_a))
    trip_id = create_r.json()["id"]
    r = await client.delete(f"{TRIPS_URL}/{trip_id}", headers=_auth(token_b))
    assert r.status_code == 403


# ---------------------------------------------------------------------------
# Stops
# ---------------------------------------------------------------------------

async def _create_trip_and_city(client, token, db_session):
    """Helper: create a trip + seed a city, return (trip_id, city_id)."""
    from app.models.city import City
    city = City(name="Tokyo", country="Japan", region="Kanto")
    db_session.add(city)
    await db_session.flush()
    city_id = str(city.id)

    r = await client.post(TRIPS_URL, json=TRIP_PAYLOAD, headers=_auth(token))
    return r.json()["id"], city_id


@pytest.mark.asyncio
async def test_add_stop(client: AsyncClient, db_session):
    token = await _register_and_login(client, USER_A)
    trip_id, city_id = await _create_trip_and_city(client, token, db_session)
    payload = {"city_id": city_id, "start_date": "2026-03-01", "end_date": "2026-03-05"}
    r = await client.post(f"{TRIPS_URL}/{trip_id}/stops", json=payload, headers=_auth(token))
    assert r.status_code == 201
    assert r.json()["city_id"] == city_id


@pytest.mark.asyncio
async def test_update_stop_dates(client: AsyncClient, db_session):
    token = await _register_and_login(client, USER_A)
    trip_id, city_id = await _create_trip_and_city(client, token, db_session)
    r = await client.post(
        f"{TRIPS_URL}/{trip_id}/stops",
        json={"city_id": city_id, "start_date": "2026-03-01", "end_date": "2026-03-05"},
        headers=_auth(token),
    )
    stop_id = r.json()["id"]
    r2 = await client.put(
        f"/api/v1/stops/{stop_id}",
        json={"end_date": "2026-03-07"},
        headers=_auth(token),
    )
    assert r2.status_code == 200
    assert r2.json()["end_date"] == "2026-03-07"


@pytest.mark.asyncio
async def test_reorder_stops(client: AsyncClient, db_session):
    token = await _register_and_login(client, USER_A)
    trip_id, city_id = await _create_trip_and_city(client, token, db_session)

    s1 = (await client.post(
        f"{TRIPS_URL}/{trip_id}/stops",
        json={"city_id": city_id, "start_date": "2026-03-01", "end_date": "2026-03-05", "order_index": 0},
        headers=_auth(token),
    )).json()["id"]
    s2 = (await client.post(
        f"{TRIPS_URL}/{trip_id}/stops",
        json={"city_id": city_id, "start_date": "2026-03-06", "end_date": "2026-03-10", "order_index": 1},
        headers=_auth(token),
    )).json()["id"]

    r = await client.put(
        f"{TRIPS_URL}/{trip_id}/stops/reorder",
        json=[{"id": s1, "order_index": 1}, {"id": s2, "order_index": 0}],
        headers=_auth(token),
    )
    assert r.status_code == 200
    ids_in_order = [s["id"] for s in r.json()]
    assert ids_in_order[0] == s2


# ---------------------------------------------------------------------------
# City + activity search
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_city_search(client: AsyncClient, db_session):
    from app.models.city import City
    db_session.add(City(name="Paris", country="France"))
    db_session.add(City(name="Berlin", country="Germany"))
    await db_session.flush()

    r = await client.get(f"{CITIES_URL}?search=par")
    assert r.status_code == 200
    names = [c["name"] for c in r.json()]
    assert "Paris" in names
    assert "Berlin" not in names


@pytest.mark.asyncio
async def test_activity_search(client: AsyncClient, db_session):
    from app.models.city import City
    from app.models.activity import Activity
    city = City(name="Rome", country="Italy")
    db_session.add(city)
    await db_session.flush()
    db_session.add(Activity(city_id=city.id, name="Colosseum Tour", category="sightseeing", cost_estimate=20))
    db_session.add(Activity(city_id=city.id, name="Pasta Class", category="food", cost_estimate=50))
    await db_session.flush()

    r = await client.get(f"{ACTIVITIES_URL}?city_id={city.id}&category=sightseeing")
    assert r.status_code == 200
    assert len(r.json()) == 1
    assert r.json()[0]["name"] == "Colosseum Tour"


# ---------------------------------------------------------------------------
# StopActivity
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_add_and_remove_activity(client: AsyncClient, db_session):
    from app.models.city import City
    from app.models.activity import Activity

    token = await _register_and_login(client, USER_A)

    city = City(name="Kyoto", country="Japan")
    db_session.add(city)
    await db_session.flush()
    activity = Activity(city_id=city.id, name="Tea Ceremony", category="culture", cost_estimate=30)
    db_session.add(activity)
    await db_session.flush()

    # Create trip + stop
    trip_r = await client.post(TRIPS_URL, json=TRIP_PAYLOAD, headers=_auth(token))
    trip_id = trip_r.json()["id"]
    stop_r = await client.post(
        f"{TRIPS_URL}/{trip_id}/stops",
        json={"city_id": str(city.id), "start_date": "2026-03-01", "end_date": "2026-03-05"},
        headers=_auth(token),
    )
    stop_id = stop_r.json()["id"]

    # Add activity
    add_r = await client.post(
        f"/api/v1/stops/{stop_id}/activities",
        json={"activity_id": str(activity.id), "scheduled_date": "2026-03-02"},
        headers=_auth(token),
    )
    assert add_r.status_code == 201
    sa_id = add_r.json()["id"]
    assert add_r.json()["activity"]["name"] == "Tea Ceremony"

    # Remove activity
    del_r = await client.delete(f"/api/v1/stop-activities/{sa_id}", headers=_auth(token))
    assert del_r.status_code == 204
