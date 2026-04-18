"""OpenWearables / Oura API integration."""

from typing import Any

import httpx


async def fetch_oura_data(oura_token: str) -> dict[str, Any]:
    """Fetch latest sleep, HRV, and stress data from Oura via OpenWearables."""
    raise NotImplementedError


async def process_oura_webhook(payload: dict[str, Any]) -> dict[str, Any]:
    """Process an incoming Oura webhook payload. Returns normalized health data."""
    raise NotImplementedError


def is_currently_sleeping(oura_data: dict[str, Any]) -> bool:
    """Check if there's an active sleep session with no end time."""
    current_sleep = oura_data.get("sleep", {}).get("current_session")
    return current_sleep is not None and current_sleep.get("end_time") is None
