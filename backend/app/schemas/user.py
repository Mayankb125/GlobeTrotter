"""
Pydantic schemas for user-related request/response models.
"""
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    """Payload for POST /auth/signup."""
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class UserLogin(BaseModel):
    """Payload for POST /auth/login."""
    email: EmailStr
    password: str = Field(..., min_length=1)


class UserOut(BaseModel):
    """Safe user representation returned to the client (no password hash)."""
    id: uuid.UUID
    name: str
    email: EmailStr
    profile_photo_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """JWT response returned after successful signup or login."""
    access_token: str
    token_type: str = "bearer"
    user: UserOut
