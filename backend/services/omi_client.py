"""Omi webhook processing."""

from typing import Any


async def process_omi_memory(payload: dict[str, Any]) -> dict[str, Any] | None:
    """Process an Omi memory webhook payload. Returns transcript text for medication extraction."""
    raise NotImplementedError
