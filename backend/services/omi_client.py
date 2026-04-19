"""Omi REST API client. Dev key endpoints live under /v1/dev/user/."""

import os
from datetime import datetime, timezone, timedelta
from typing import Any

import httpx

OMI_BASE = "https://api.omi.me"


def _headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {os.environ['OMI_DEV_KEY']}"}


async def get_memories(limit: int = 25, offset: int = 0) -> list[dict]:
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{OMI_BASE}/v1/dev/user/memories",
            headers=_headers(),
            params={"limit": limit, "offset": offset},
        )
        r.raise_for_status()
        data = r.json()
        return data if isinstance(data, list) else data.get("memories", [])


async def get_conversations(
    limit: int = 25,
    offset: int = 0,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    include_transcript: bool = True,
) -> list[dict]:
    params: dict[str, Any] = {"limit": limit, "offset": offset, "include_transcript": include_transcript}
    if start_date:
        params["start_date"] = start_date.isoformat()
    if end_date:
        params["end_date"] = end_date.isoformat()
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{OMI_BASE}/v1/dev/user/conversations",
            headers=_headers(),
            params=params,
        )
        r.raise_for_status()
        data = r.json()
        return data if isinstance(data, list) else data.get("conversations", [])


async def get_last_hour_conversations() -> list[dict]:
    since = datetime.now(timezone.utc) - timedelta(hours=1)
    return await get_conversations(limit=50, start_date=since, include_transcript=True)
