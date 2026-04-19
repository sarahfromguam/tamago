from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel

ActionType = Literal["text", "call", "facetime", "coffee", "food"]


class SupportActionCreate(BaseModel):
    supporter_phone: str
    action_type: ActionType


class SupportActionOut(BaseModel):
    id: UUID
    user_id: UUID
    supporter_phone: str
    action_type: ActionType
    created_at: datetime
