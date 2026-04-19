"""Demo endpoints — real Oura data for Sarah + seeded patients for the feed.

Falls back to Supabase seeded data when DEMO_OURA_TOKEN is not configured.
"""

from __future__ import annotations

import os
from datetime import date

from fastapi import APIRouter

from models.health_snapshot import Dimensions
from services import db, oura
from services.health_compute import compute_tamago_state

router = APIRouter(prefix="/api/demo", tags=["demo"])

DEMO_TOKEN = os.environ.get("DEMO_OURA_TOKEN", "")
DEMO_UID = os.environ.get("DEMO_UID", "user_mia")


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
            "sleep":  {"score": 92, "label": "8.2h",     "sublabel": "well rested"},
            "stress": {"score": 88, "label": "HRV 62ms", "sublabel": "good recovery"},
            "meds":   {"score": 100, "label": "Taken",   "sublabel": "all doses taken"},
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
            "sleep":  {"score": 44, "label": "3.9h",     "sublabel": "deep deficit"},
            "stress": {"score": 51, "label": "HRV 28ms", "sublabel": "needs rest"},
            "meds":   {"score": 60, "label": "Partial",  "sublabel": "missed evening ibuprofen"},
        },
        "base": "fried",
        "is_sleeping": False,
        "supported": True,
        "support_count": 4,
        "recommended_actions": ["food", "call", "text"],
    },
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _meds_from_supabase(uid: str) -> tuple[str, dict]:
    """Compute today's meds dimension from medication_logs vs medication_schedule."""
    today = str(date.today())
    try:
        schedule = db.get_schedule(uid)
        logs = db.get_logs(uid, date=today)
        logged_names = {l["medication_name"] for l in logs}

        if not schedule:
            return "grey", {"score": 0, "label": "—", "sublabel": "not tracked"}

        taken = sum(1 for s in schedule if s["medication_name"] in logged_names)
        total = len(schedule)
        ratio = taken / total
        score = int(ratio * 100)

        if ratio >= 0.9:
            return "green", {"score": score, "label": "Taken",   "sublabel": "all doses taken"}
        elif ratio >= 0.5:
            return "yellow", {"score": score, "label": "Partial", "sublabel": f"{taken}/{total} taken today"}
        else:
            return "red",    {"score": score, "label": "Missed",  "sublabel": f"only {taken}/{total} taken"}
    except Exception:
        return "grey", {"score": 0, "label": "—", "sublabel": "not tracked"}


def _tamago_from_supabase(uid: str) -> dict:
    """Build a tamago state from Supabase seeded data."""
    meds_state, meds_detail = _meds_from_supabase(uid)
    dims = Dimensions(sleep="yellow", stress="green", meds=meds_state)
    state = compute_tamago_state(dims, is_sleeping=False, support_count=0)

    try:
        user = db.get_user(uid)
        name = user["name"] if user else "My Tamago"
    except Exception:
        name = "My Tamago"

    return {
        "slug": uid,
        "name": name,
        **state.model_dump(),
        "dimension_details": {
            "sleep":  {"score": 72, "label": "6.5h",     "sublabel": "slightly short"},
            "stress": {"score": 80, "label": "HRV 47ms", "sublabel": "recovering well"},
            "meds":   meds_detail,
        },
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/tamago", response_model=dict)
async def get_demo_tamago():
    """EggState — real Oura data if token configured, otherwise Supabase seeded data."""
    if DEMO_TOKEN:
        try:
            sleep_records, readiness_records, sessions = await _fetch_oura()
            dims, details = oura.compute_dimensions_from_oura(sleep_records, readiness_records, sessions)
            sleeping = oura.is_currently_sleeping(sessions)
            state = compute_tamago_state(dims, sleeping, 0)
            return {"slug": "sarahs-egg", "name": "Sarah", "phone": "", **state.model_dump(), "dimension_details": details}
        except Exception:
            pass

    return _tamago_from_supabase(DEMO_UID)


@router.get("/feed", response_model=list)
async def get_demo_feed():
    """Feed combining primary user (Oura or Supabase) + seeded patients."""
    primary = _tamago_from_supabase(DEMO_UID)

    if DEMO_TOKEN:
        try:
            sleep_records, readiness_records, sessions = await _fetch_oura()
            dims, details = oura.compute_dimensions_from_oura(sleep_records, readiness_records, sessions)
            sleeping = oura.is_currently_sleeping(sessions)
            state = compute_tamago_state(dims, sleeping, 0)
            primary = {"slug": "sarahs-egg", "name": "Sarah", "phone": "", **state.model_dump(), "dimension_details": details}
        except Exception:
            pass

    return [primary] + SEEDED_PATIENTS


async def _fetch_oura():
    import asyncio
    return await asyncio.gather(
        oura.get_daily_sleep(DEMO_TOKEN, days=3),
        oura.get_daily_readiness(DEMO_TOKEN, days=3),
        oura.get_sleep_sessions(DEMO_TOKEN),
    )
