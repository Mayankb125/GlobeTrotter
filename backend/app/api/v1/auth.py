"""
Auth routes: signup, login, forgot-password, and /me (protected test endpoint).
"""
import logging
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.user import TokenResponse, UserCreate, UserLogin, UserOut, UserUpdate
from app.api.v1.deps import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


# ---------------------------------------------------------------------------
# 3.3 — POST /auth/signup
# ---------------------------------------------------------------------------

@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def signup(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Create a new user account.

    - Validates email uniqueness.
    - Hashes the password with bcrypt.
    - Returns a JWT access token alongside the created user.
    """
    # Check for duplicate email
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    await db.flush()   # assigns user.id without committing yet
    await db.refresh(user)

    token = create_access_token(subject=str(user.id))
    return TokenResponse(access_token=token, user=user)


# ---------------------------------------------------------------------------
# 3.4 — POST /auth/login
# ---------------------------------------------------------------------------

@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate and receive a JWT",
)
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)):
    """
    Verify credentials and return a JWT access token.

    Raises 401 for both unknown email and wrong password (intentionally
    indistinguishable to avoid user-enumeration).
    """
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalars().first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(subject=str(user.id))
    return TokenResponse(access_token=token, user=user)


# ---------------------------------------------------------------------------
# 3.5 — POST /auth/forgot-password  (MVP stub)
# ---------------------------------------------------------------------------

@router.post(
    "/forgot-password",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Request a password-reset token (stub)",
)
async def forgot_password(email: str, db: AsyncSession = Depends(get_db)):
    """
    MVP stub: generates a reset token and logs it to the console.
    Real email delivery is wired up post-MVP.
    """
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()

    if user:
        reset_token = secrets.token_urlsafe(32)
        # TODO: replace with real email dispatch (e.g. SendGrid / SES)
        logger.info(
            "PASSWORD RESET TOKEN for %s → %s",
            email,
            reset_token,
        )

    # Always return the same response to prevent user enumeration
    return {"detail": "If that email is registered, a reset link has been sent."}


# ---------------------------------------------------------------------------
# 3.7 — GET /auth/me  (protected test endpoint)
# ---------------------------------------------------------------------------

@router.get(
    "/me",
    response_model=UserOut,
    summary="Return the currently authenticated user",
)
async def me(current_user: User = Depends(get_current_user)):
    """
    Returns the profile of the user identified by the Bearer token.
    Returns 401 if the token is missing or invalid.
    """
    return current_user


@router.put(
    "/me",
    response_model=UserOut,
    summary="Update the currently authenticated user's profile",
)
async def update_me(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update profile details for the authenticated user.
    Supports updating name, email, profile_photo_url, and password.
    """
    if payload.email and payload.email != current_user.email:
        # Check for email conflicts
        existing = await db.execute(select(User).where(User.email == payload.email))
        if existing.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )
        current_user.email = payload.email

    if payload.name is not None:
        current_user.name = payload.name
    if payload.profile_photo_url is not None:
        current_user.profile_photo_url = payload.profile_photo_url
    if payload.password is not None:
        current_user.password_hash = hash_password(payload.password)

    await db.flush()
    await db.refresh(current_user)
    return current_user


@router.delete(
    "/me",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete the currently authenticated user's account",
)
async def delete_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Permanently delete the authenticated user's account and all associated data.
    """
    await db.delete(current_user)
