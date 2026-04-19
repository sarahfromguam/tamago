from __future__ import annotations

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel

DimensionState = Literal["green", "yellow", "red", "grey"]


class Dimensions(BaseModel):
    sleep: DimensionState = "grey"
    stress: DimensionState = "grey"
    meds: DimensionState = "grey"


class HealthSnapshotCreate(BaseModel):
    user_id: UUID
    source: Literal["oura", "omi", "manual"]
    raw_data: dict[str, Any]
    dimensions: Dimensions
    is_sleeping: bool = False


class HealthSnapshotOut(BaseModel):
    id: UUID
    user_id: UUID
    source: str
    raw_data: dict[str, Any]
    dimensions: Dimensions
    is_sleeping: bool
    timestamp: datetime
