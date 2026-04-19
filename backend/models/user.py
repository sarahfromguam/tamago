from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class UserCreate(BaseModel):
    phone: str
    name: str  # display name, e.g. "Sarah's Egg"
    slug: str | None = None  # auto-generated from name if omitted


class UserUpdate(BaseModel):
    name: str | None = None
    oura_token: str | None = None  # Oura OAuth access token
    omi_enabled: bool | None = None


class UserOut(BaseModel):
    id: UUID
    phone: str
    name: str
    slug: str
    oura_connected: bool = False  # true if oura_token is set (don't expose raw token)
    omi_enabled: bool
    created_at: datetime
