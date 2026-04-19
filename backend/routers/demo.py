"""Demo endpoints — real Oura data for Sarah + seeded patients + feature demos.

No Supabase required.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from datetime import date as date_type

from services import oura, db, omi_client, webhook_log
from services.extractor import detect_taken, detect_distress
from services.health_compute import compute_tamago_state

DEMO_UID = os.environ.get("OMI_UID", "user_mia")


def _compute_meds_from_supabase(uid: str) -> tuple[str, dict]:
    """Return (dimension_state, detail) from today's schedule vs logs."""
    today = date_type.today().isoformat()
    schedule = db.get_schedule(uid)
    logs = db.get_logs(uid, date=today)
    if not schedule:
        return "grey", {"score": 0, "label": "No schedule", "sublabel": "", "history": []}
    logged_names = {l["medication_name"].lower() for l in logs if l.get("source") != "manual"}
    taken = sum(1 for m in schedule if m["medication_name"].lower() in logged_names)
    total = len(schedule)
    score = round((taken / total) * 100)
    if score == 100:
        state, label, sublabel = "green", "All taken", "on schedule"
    elif score >= 50:
        state, label, sublabel = "yellow", f"{taken}/{total} taken", "some missed"
    else:
        state, label, sublabel = "red", f"{taken}/{total} taken", "needs attention"
    return state, {"score": score, "label": label, "sublabel": sublabel, "history": []}

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
# Demo override — Sarah starts as "fried" for demo, flips to "okay" on meds
# ---------------------------------------------------------------------------

_SARAH_FRIED: dict = {
    "slug": "sarahs-egg",
    "name": "Sarah",
    "phone": "",
    "base": "fried",
    "is_sleeping": False,
    "supported": True,
    "support_count": 2,
    "dimensions": {"sleep": "red", "stress": "red", "meds": "red"},
    "dimension_details": {
        "sleep":    {"score": 20, "label": "2.0h",      "sublabel": "severe deficit",  "history": [65, 55, 45, 38, 30, 24, 20]},
        "stress":   {"score": 35, "label": "HRV 22ms",  "sublabel": "high stress",     "history": [60, 52, 48, 42, 38, 35, 35]},
        "activity": {"score": 18, "label": "340 steps",  "sublabel": "very sedentary",  "history": [50, 42, 35, 28, 22, 20, 18]},
        "meds":     {"score": 0,  "label": "0/5 taken",  "sublabel": "none taken",      "history": []},
    },
    "vitals": {"steps": 340, "resting_hr": 88, "hrv": 22},
    "recommended_actions": ["call", "food", "text"],
}

_SARAH_OKAY: dict = {
    **_SARAH_FRIED,
    "base": "okay",
    "dimensions": {"sleep": "red", "stress": "red", "meds": "green"},
    "dimension_details": {
        **_SARAH_FRIED["dimension_details"],
        "meds": {"score": 100, "label": "All taken", "sublabel": "on schedule", "history": []},
    },
    "recommended_actions": ["food", "text", "coffee"],
}

# Starts in fried state; POST /api/demo/take-meds flips it
_demo_sarah_state: dict = dict(_SARAH_FRIED)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _fetch_sarah() -> dict:
    """Build a live FeedItem for Sarah from real Oura data + Supabase meds."""
    sleep_records, readiness_records, sessions, activity_records = await _fetch_oura()
    dims, details, vitals = oura.compute_dimensions_from_oura(
        sleep_records, readiness_records, sessions, activity_records
    )
    sleeping = oura.is_currently_sleeping(sessions)
    meds_state, meds_detail = _compute_meds_from_supabase(DEMO_UID)
    dims.meds = meds_state
    details["meds"] = meds_detail
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
    """Return demo-overridden Sarah state (fried or okay)."""
    return dict(_demo_sarah_state)


@router.get("/feed", response_model=list)
async def get_demo_feed():
    """Feed: Sarah (demo override) + seeded patients."""
    return [dict(_demo_sarah_state)] + SEEDED_PATIENTS


@router.post("/take-meds")
async def take_meds():
    """Flip Sarah from fried → okay (simulates medication taken)."""
    global _demo_sarah_state
    _demo_sarah_state = dict(_SARAH_OKAY)
    return {"status": "ok", "new_base": "okay"}


@router.post("/reset-sarah")
async def reset_sarah():
    """Reset Sarah back to fried state for re-demo."""
    global _demo_sarah_state
    _demo_sarah_state = dict(_SARAH_FRIED)
    return {"status": "ok", "new_base": "fried"}


@router.get("/patient/{slug}", response_model=dict)
async def get_demo_patient(slug: str):
    """Return a single patient by slug — Sarah is live, others are seeded."""
    if slug in ("sarahs-egg", "user_mia"):
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


# ---------------------------------------------------------------------------
# Omi pipeline demo
# ---------------------------------------------------------------------------

@router.get("/omi-conversations")
async def get_omi_conversations(limit: int = 10):
    """Fetch recent Omi conversations and annotate each with the pipeline path it would trigger."""
    schedule = db.get_schedule(DEMO_UID)
    try:
        conversations = await omi_client.get_conversations(limit=limit, include_transcript=True)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Omi API error: {exc}")

    result = []
    for conv in conversations:
        segments = conv.get("transcript_segments") or []
        transcript = " ".join(s.get("text", "").strip() for s in segments if s.get("text", "").strip())

        path = "none"
        match_info = None

        if transcript:
            taken_match = detect_taken(transcript, schedule)
            if taken_match:
                path = "taken"
                match_info = {"medication": taken_match["medication_name"], "quote": taken_match.get("raw_quote", "")}
            elif detect_distress(transcript):
                path = "distress"
            else:
                path = "none"

        result.append({
            "id": conv.get("id"),
            "started_at": conv.get("started_at"),
            "finished_at": conv.get("finished_at"),
            "transcript": transcript,
            "path": path,
            "match": match_info,
        })

    return result


class RunConversationRequest(BaseModel):
    transcript: str
    conversation_id: str


@router.post("/omi-run")
async def run_omi_pipeline(body: RunConversationRequest):
    """Dry-run a transcript through the pipeline and return what action would be taken."""
    schedule = db.get_schedule(DEMO_UID)
    today = date_type.today().isoformat()
    logs = db.get_logs(DEMO_UID, date=today)
    logged_names = {l["medication_name"] for l in logs}

    steps = []
    steps.append({"step": "receive", "label": "Webhook received", "detail": f"{len(body.transcript.split())} words"})

    taken_match = detect_taken(body.transcript, schedule)
    if taken_match:
        steps.append({"step": "detect", "label": "LLM: Medication taken", "detail": f'"{taken_match.get("raw_quote", "")}"', "result": "match"})
        db.put_medication_log({
            "uid": DEMO_UID,
            "date": today,
            "medication_name": taken_match["medication_name"],
            "dose": taken_match.get("dose"),
            "unit": taken_match.get("unit"),
            "taken_at": datetime.now(timezone.utc).isoformat(),
            "source": "webhook",
            "conversation_id": body.conversation_id,
            "confidence_score": taken_match.get("confidence"),
            "notes": taken_match.get("raw_quote"),
        })
        steps.append({"step": "action", "label": "Updated Status", "detail": taken_match["medication_name"], "result": "success"})
        return {"path": "taken", "steps": steps}

    if detect_distress(body.transcript):
        pending = next((m for m in schedule if m["medication_name"] not in logged_names), None)
        steps.append({"step": "detect", "label": "LLM: Distress detected", "detail": "stress signal found", "result": "match"})
        if pending:
            steps.append({"step": "action", "label": "WhatsApp → caregiver", "detail": f"re: {pending['medication_name']}", "result": "success"})
        return {"path": "distress", "steps": steps}

    steps.append({"step": "detect", "label": "LLM: Analysing transcript", "detail": "no health events found", "result": "skip"})
    return {"path": "none", "steps": steps}


@router.get("/webhook-log")
async def get_webhook_log():
    """Return Omi conversations received via live webhook (in-memory, newest first)."""
    return webhook_log.get_all()
