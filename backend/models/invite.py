from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel


class InviteCreate(BaseModel):
    invitee_phone: str


class InviteAccept(BaseModel):
    phone: str


class InviteOut(BaseModel):
    id: UUID
    user_id: UUID
    invitee_phone: str
    invite_code: str
    status: Literal["pending", "accepted"]
    created_at: datetime
