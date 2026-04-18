from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

from .health_snapshot import Dimensions

EggBase = Literal["thriving", "okay", "struggling", "fried"]


class EggState(BaseModel):
    base: EggBase
    is_sleeping: bool = False
    supported: bool = False
    support_count: int = 0
    dimensions: Dimensions

    # Contextual actions ordered by recommendation priority
    recommended_actions: list[str] = []
