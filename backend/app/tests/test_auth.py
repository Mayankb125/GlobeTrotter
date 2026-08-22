"""
Phase 3.8 — Auth endpoint tests.

Covers:
- Successful signup
- Duplicate email rejection (409)
- Successful login
- Wrong password rejection (401)
- Unknown email rejection (401)
- Protected /me with valid token (200)
- Protected /me without token (403/401)
"""
import pytest
from httpx import AsyncClient


SIGNUP_URL = "/api/v1/auth/signup"
LOGIN_URL = "/api/v1/auth/login"
ME_URL = "/api/v1/auth/me"

VALID_USER = {
    "name": "Alice Wanderer",
    "email": "alice@globetrotter-example.com",
    "password": "securepass123",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _signup(client: AsyncClient, payload: dict = None) -> dict:
    payload = payload or VALID_USER
    resp = await client.post(SIGNUP_URL, json=payload)
    return resp


async def _get_token(client: AsyncClient) -> str:
    resp = await _signup(client)
    return resp.json()["access_token"]


# ---------------------------------------------------------------------------
# Signup tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_signup_success(client: AsyncClient):
    resp = await _signup(client)
    assert resp.status_code == 201
    body = resp.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"
    assert body["user"]["email"] == VALID_USER["email"]
    assert body["user"]["name"] == VALID_USER["name"]
    assert "password" not in body["user"]
    assert "password_hash" not in body["user"]


@pytest.mark.asyncio
async def test_signup_duplicate_email(client: AsyncClient):
    await _signup(client)
    resp = await _signup(client)  # same email again
    assert resp.status_code == 409
    assert "already exists" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_signup_short_password(client: AsyncClient):
    resp = await client.post(SIGNUP_URL, json={**VALID_USER, "password": "short"})
    assert resp.status_code == 422  # Pydantic validation error


# ---------------------------------------------------------------------------
# Login tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    await _signup(client)
    resp = await client.post(LOGIN_URL, json={
        "email": VALID_USER["email"],
        "password": VALID_USER["password"],
    })
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert body["user"]["email"] == VALID_USER["email"]


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await _signup(client)
    resp = await client.post(LOGIN_URL, json={
        "email": VALID_USER["email"],
        "password": "wrongpassword",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_unknown_email(client: AsyncClient):
    resp = await client.post(LOGIN_URL, json={
        "email": "nobody@nobody-example.com",
        "password": "somepassword",
    })
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Protected route tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_me_with_valid_token(client: AsyncClient):
    token = await _get_token(client)
    resp = await client.get(ME_URL, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["email"] == VALID_USER["email"]


@pytest.mark.asyncio
async def test_me_without_token(client: AsyncClient):
    resp = await client.get(ME_URL)
    # HTTPBearer returns 403 when no credentials are provided
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_me_with_invalid_token(client: AsyncClient):
    resp = await client.get(ME_URL, headers={"Authorization": "Bearer invalidtoken.abc.xyz"})
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Update / Delete profile tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_update_me_success(client: AsyncClient):
    token = await _get_token(client)
    resp = await client.put(
        ME_URL,
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Alice Wanderer Updated", "profile_photo_url": "http://photo.com/alice.jpg"}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["name"] == "Alice Wanderer Updated"
    assert body["profile_photo_url"] == "http://photo.com/alice.jpg"


@pytest.mark.asyncio
async def test_update_me_email_conflict(client: AsyncClient):
    token = await _get_token(client)
    
    # Create another user
    await _signup(client, {
        "name": "Bob Wanderer",
        "email": "bob@globetrotter-example.com",
        "password": "securepass456"
    })
    
    # Try updating Alice's email to Bob's email
    resp = await client.put(
        ME_URL,
        headers={"Authorization": f"Bearer {token}"},
        json={"email": "bob@globetrotter-example.com"}
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_update_me_password(client: AsyncClient):
    token = await _get_token(client)
    
    # Update password
    resp = await client.put(
        ME_URL,
        headers={"Authorization": f"Bearer {token}"},
        json={"password": "newsecurepassword123"}
    )
    assert resp.status_code == 200
    
    # Attempt login with old password (should fail)
    login_resp = await client.post(LOGIN_URL, json={
        "email": VALID_USER["email"],
        "password": VALID_USER["password"]
    })
    assert login_resp.status_code == 401
    
    # Attempt login with new password (should succeed)
    login_resp2 = await client.post(LOGIN_URL, json={
        "email": VALID_USER["email"],
        "password": "newsecurepassword123"
    })
    assert login_resp2.status_code == 200


@pytest.mark.asyncio
async def test_delete_me_success(client: AsyncClient):
    token = await _get_token(client)
    
    # Delete Alice
    resp = await client.delete(
        ME_URL,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 204
    
    # Check that me request now fails
    resp2 = await client.get(ME_URL, headers={"Authorization": f"Bearer {token}"})
    assert resp2.status_code == 401
