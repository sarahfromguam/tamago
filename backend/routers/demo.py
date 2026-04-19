"""Demo endpoints — real Oura data for Sarah + seeded patients + feature demos.

No Supabase required.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from models.health_snapshot import Dimensions
from services import oura
from services.health_compute import compute_tamago_state

router = APIRouter(prefix="/api/demo", tags=["demo"])

DEMO_TOKEN = os.environ.get("DEMO_OURA_TOKEN", "")

# In-memory OMI log for demo (resets on server restart)
_omi_log: list[dict] = []

# In-memory dimension visibility config per slug
_DEFAULT_VISIBILITY = {"sleep": True, "stress": True, "meds": True, "activity": True}
_visibility: dict[str, dict] = {}

# Seeded support circle for Sarah
_SARAH_CIRCLE = [
    {"name": "Alex",   "phone": "+15551111111", "relationship": "Partner",    "tier": 1, "role": "caregiver"},
    {"name": "Mom",    "phone": "+15552222222", "relationship": "Mother",     "tier": 1, "role": "caregiver"},
    {"name": "Jenna",  "phone": "+15553333333", "relationship": "Best friend","tier": 2, "role": "friend"},
    {"name": "Dr. Kim","phone": "+15554444444", "relationship": "Therapist",  "tier": 2, "role": "friend"},
]


# ---------------------------------------------------------------------------
# Seeded patients
# ---------------------------------------------------------------------------

SEEDED_PATIENTS = [
    {
        "slug": "emma-thriving",
        "name": "Emma",
        "phone": "+15559876543",
        "dimensions": {"sleep": "green", "stress": "green", "meds": "green"},
        "dimension_details": {
            "sleep":    {"score": 92, "label": "8.2h",     "sublabel": "well rested",    "history": [88, 91, 94, 90, 87, 93, 92]},
            "stress":   {"score": 88, "label": "HRV 62ms", "sublabel": "good recovery",  "history": [82, 85, 86, 88, 84, 87, 88]},
            "activity": {"score": 90, "label": "9,420 steps", "sublabel": "great movement", "history": [78, 82, 88, 91, 85, 90, 90]},
            "meds":     {"score": 100, "label": "Taken",   "sublabel": "on schedule",    "history": []},
        },
        "vitals": {"steps": 9420, "resting_hr": 54, "hrv": 62},
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
            "sleep":    {"score": 44, "label": "3.9h",     "sublabel": "deep deficit",   "history": [72, 65, 58, 50, 44, 40, 44]},
            "stress":   {"score": 51, "label": "HRV 28ms", "sublabel": "needs rest",     "history": [70, 62, 58, 53, 51, 49, 51]},
            "activity": {"score": 30, "label": "820 steps", "sublabel": "very sedentary", "history": [55, 48, 40, 35, 32, 28, 30]},
            "meds":     {"score": 60, "label": "Partial",  "sublabel": "missed evening", "history": []},
        },
        "vitals": {"steps": 820, "resting_hr": 78, "hrv": 28},
        "base": "fried",
        "is_sleeping": False,
        "supported": True,
        "support_count": 4,
        "recommended_actions": ["call", "food", "text"],
    },
    {
        "slug": "jake-sleeping",
        "name": "Jake",
        "phone": "+15555550202",
        "dimensions": {"sleep": "yellow", "stress": "green", "meds": "green"},
        "dimension_details": {
            "sleep":    {"score": 65, "label": "5.5h",       "sublabel": "catching up",    "history": [70, 58, 62, 55, 60, 63, 65]},
            "stress":   {"score": 80, "label": "HRV 55ms",   "sublabel": "recovering",     "history": [74, 76, 78, 80, 77, 79, 80]},
            "activity": {"score": 68, "label": "4,800 steps", "sublabel": "moderate",       "history": [72, 65, 70, 68, 60, 66, 68]},
            "meds":     {"score": 100, "label": "Taken",      "sublabel": "on schedule",    "history": []},
        },
        "vitals": {"steps": 4800, "resting_hr": 60, "hrv": 55},
        "base": "okay",
        "is_sleeping": True,
        "supported": False,
        "support_count": 0,
        "recommended_actions": ["text", "coffee"],
    },
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _fetch_sarah() -> dict:
    """Build a live FeedItem for Sarah from real Oura data."""
    sleep_records, readiness_records, sessions, activity_records = await _fetch_oura()
    dims, details, vitals = oura.compute_dimensions_from_oura(
        sleep_records, readiness_records, sessions, activity_records
    )
    sleeping = oura.is_currently_sleeping(sessions)
    state = compute_tamago_state(dims, sleeping, 0)
    return {
        "slug": "sarahs-egg",
        "name": "Sarah",
        "phone": "",
        **state.model_dump(),
        "dimension_details": details,
        "vitals": vitals,
    }


async def _fetch_oura():
    import asyncio
    return await asyncio.gather(
        oura.get_daily_sleep(DEMO_TOKEN, days=7),
        oura.get_daily_readiness(DEMO_TOKEN, days=7),
        oura.get_sleep_sessions(DEMO_TOKEN),
        oura.get_daily_activity(DEMO_TOKEN, days=7),
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/tamago", response_model=dict)
async def get_demo_tamago():
    """Live EggState from real Oura data for Sarah."""
    if not DEMO_TOKEN:
        raise HTTPException(status_code=503, detail="DEMO_OURA_TOKEN not configured")
    try:
        return await _fetch_sarah()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Oura API error: {exc}")


@router.get("/feed", response_model=list)
async def get_demo_feed():
    """Feed: Sarah (live Oura) + seeded patients."""
    sarah: dict = {}
    if DEMO_TOKEN:
        try:
            sarah = await _fetch_sarah()
        except Exception:
            pass
    return ([sarah] if sarah else []) + SEEDED_PATIENTS


@router.get("/patient/{slug}", response_model=dict)
async def get_demo_patient(slug: str):
    """Return a single patient by slug — Sarah is live, others are seeded."""
    if slug == "sarahs-egg":
        return await get_demo_tamago()
    patient = next((p for p in SEEDED_PATIENTS if p["slug"] == slug), None)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


class BabyBreakRequest(BaseModel):
    message: str | None = None


@router.post("/baby-break")
async def request_baby_break(body: BabyBreakRequest | None = None):
    """Simulate sending a Baby Break alert to the support circle."""
    msg = (body.message if body and body.message
           else "Hey — Sarah's Tamago is showing she could use a break. Can you take the baby for 30 minutes?")
    # In production: fire Twilio SMS to Tier 1 circle members
    return {
        "sent": True,
        "message": msg,
        "recipients": ["Partner (Tier 1)", "Mom (Tier 1)"],
        "sent_at": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/dire-alert/{slug}")
async def send_dire_alert(slug: str):
    """Alert primary caregivers when a tamago is in critical condition.

    Triggered when someone hasn't taken their medication at all or has
    multiple red dimensions (\"fried\" state).  Only caregivers — not
    regular friends — receive the SMS.

    In production: fire Twilio SMS via send_dire_alert_sms to each caregiver.
    """
    circle = _SARAH_CIRCLE if slug == "sarahs-egg" else [
        {"name": "Friend", "phone": "+15550000000", "relationship": "Friend", "tier": 1, "role": "caregiver"},
    ]
    caregivers = [m for m in circle if m.get("role") == "caregiver"]
    if not caregivers:
        raise HTTPException(status_code=404, detail="No caregivers found for this user")

    # Look up the patient name
    patient_name = "Sarah" if slug == "sarahs-egg" else slug
    for p in SEEDED_PATIENTS:
        if p["slug"] == slug:
            patient_name = p["name"]
            break

    msg = (
        f"{patient_name}'s Tamago is in critical condition — "
        f"they haven't taken their medication. Please check in on them."
    )

    return {
        "sent": True,
        "message": msg,
        "recipients": [f"{c['name']} ({c['relationship']})" for c in caregivers],
        "phones": [c["phone"] for c in caregivers],
        "sent_at": datetime.now(timezone.utc).isoformat(),
    }


class OmiLogRequest(BaseModel):
    medication: str


@router.post("/omi-log")
async def log_medication(body: OmiLogRequest):
    """Simulate OMI voice detection logging a medication."""
    entry = {
        "medication": body.medication,
        "logged_at": datetime.now(timezone.utc).isoformat(),
        "source": "omi_voice",
    }
    _omi_log.append(entry)
    return {"logged": True, **entry}


@router.get("/omi-log")
async def get_omi_log():
    """Return all OMI medication logs for this session."""
    return _omi_log


# ---------------------------------------------------------------------------
# Dimension visibility
# ---------------------------------------------------------------------------

class VisibilityRequest(BaseModel):
    sleep: bool = True
    stress: bool = True
    meds: bool = True
    activity: bool = True


@router.get("/visibility/{slug}")
async def get_visibility(slug: str):
    """Return which dimensions are visible to supporters for this slug."""
    return _visibility.get(slug, _DEFAULT_VISIBILITY)


@router.put("/visibility/{slug}")
async def set_visibility(slug: str, body: VisibilityRequest):
    """Update which dimensions supporters can see."""
    config = body.model_dump()
    _visibility[slug] = config
    return config


# ---------------------------------------------------------------------------
# Support circle
# ---------------------------------------------------------------------------

@router.get("/circle/{slug}")
async def get_circle(slug: str):
    """Return the support circle for a user (seeded for Sarah)."""
    if slug == "sarahs-egg":
        return _SARAH_CIRCLE
    # Generic placeholder for seeded patients
    return [
        {"name": "Friend", "phone": "+15550000000", "relationship": "Friend", "tier": 1},
    ]
