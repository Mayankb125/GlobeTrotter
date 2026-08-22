"""
Auth routes: signup, login, forgot-password.
"""
import logging
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.user import TokenResponse, UserCreate, UserLogin

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
