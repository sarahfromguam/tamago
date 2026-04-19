"""Demo endpoints — real Oura data for Sarah + seeded patients for the feed.

No Supabase required.
"""

from __future__ import annotations

import os

from fastapi import APIRouter, HTTPException

from models.health_snapshot import Dimensions
from services import oura
from services.health_compute import compute_tamago_state

router = APIRouter(prefix="/api/demo", tags=["demo"])

DEMO_TOKEN = os.environ.get("DEMO_OURA_TOKEN", "")


# ---------------------------------------------------------------------------
# Seeded patients (fixed data representing different health states)
# ---------------------------------------------------------------------------

SEEDED_PATIENTS = [
    {
        "slug": "emma-thriving",
        "name": "Emma",
        "phone": "+15559876543",
        "dimensions": {"sleep": "green", "stress": "green", "meds": "green"},
        "dimension_details": {
            "sleep":  {"score": 92, "label": "8.2h",    "sublabel": "well rested"},
            "stress": {"score": 88, "label": "HRV 62ms", "sublabel": "good recovery"},
            "meds":   {"score": 100, "label": "Taken",  "sublabel": "on schedule"},
        },
        "base": "thriving",
        "is_sleeping": False,
        "supported": False,
        "support_count": 0,
        "recommended_actions": ["text", "coffee"],
    },
    {
        "slug": "mia-struggling",
        "name": "Mia",
        "phone": "+15555550101",
        "dimensions": {"sleep": "red", "stress": "red", "meds": "yellow"},
        "dimension_details": {
            "sleep":  {"score": 44, "label": "3.9h",    "sublabel": "deep deficit"},
            "stress": {"score": 51, "label": "HRV 28ms", "sublabel": "needs rest"},
            "meds":   {"score": 60, "label": "Partial", "sublabel": "missed evening dose"},
        },
        "base": "fried",
        "is_sleeping": False,
        "supported": True,
        "support_count": 4,
        "recommended_actions": ["food", "call", "text"],
    },
]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/tamago", response_model=dict)
async def get_demo_tamago():
    """Live EggState from real Oura data for the primary demo user (Sarah)."""
    if not DEMO_TOKEN:
        raise HTTPException(status_code=503, detail="DEMO_OURA_TOKEN not configured")

    try:
        sleep_records, readiness_records, sessions = await _fetch_oura()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Oura API error: {exc}")

    dims, details = oura.compute_dimensions_from_oura(sleep_records, readiness_records, sessions)
    sleeping = oura.is_currently_sleeping(sessions)
    state = compute_tamago_state(dims, sleeping, 0)

    return {
        "slug": "sarahs-egg",
        "name": "Sarah",
        "phone": "",
        **state.model_dump(),
        "dimension_details": details,
    }


@router.get("/feed", response_model=list)
async def get_demo_feed():
    """Feed combining real Oura data (Sarah) + seeded patients."""
    sarah: dict = {}
    if DEMO_TOKEN:
        try:
            sleep_records, readiness_records, sessions = await _fetch_oura()
            dims, details = oura.compute_dimensions_from_oura(sleep_records, readiness_records, sessions)
            sleeping = oura.is_currently_sleeping(sessions)
            state = compute_tamago_state(dims, sleeping, 0)
            sarah = {
                "slug": "sarahs-egg",
                "name": "Sarah",
                "phone": "",
                **state.model_dump(),
                "dimension_details": details,
            }
        except Exception:
            pass

    return ([sarah] if sarah else []) + SEEDED_PATIENTS


async def _fetch_oura():
    import asyncio
    return await asyncio.gather(
        oura.get_daily_sleep(DEMO_TOKEN, days=3),
        oura.get_daily_readiness(DEMO_TOKEN, days=3),
        oura.get_sleep_sessions(DEMO_TOKEN),
    )
