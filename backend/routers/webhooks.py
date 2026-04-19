import json
import logging
import os
from datetime import datetime, timezone
from fastapi import APIRouter, BackgroundTasks, Query, Request
from pydantic import BaseModel

from services.extractor import detect_distress, detect_taken, extract_medication_events
from services.twilio_message import send_caregiver_message as send_caregiver_sms
from services import db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhook", tags=["webhooks"])

CAREGIVER_PHONE = os.environ.get("CAREGIVER_PHONE", "")


class TranscriptSegment(BaseModel):
    text: str
    speaker: str | None = None
    speaker_name: str | None = None
    is_user: bool = False
    start: float | None = None
    end: float | None = None


class StructuredSummary(BaseModel):
    title: str | None = None
    overview: str | None = None
    category: str | None = None
    action_items: list[dict] = []
    events: list[dict] = []


class MemoryWebhookPayload(BaseModel):
    id: str
    created_at: datetime | None = None
    started_at: datetime | None = None
    finished_at: datetime | None = None
    language: str | None = None
    source: str | None = None
    transcript_segments: list[TranscriptSegment] = []
    structured: StructuredSummary | None = None
    discarded: bool = False


def _stitch_transcript(segments: list[TranscriptSegment]) -> str:
    return " ".join(s.text.strip() for s in segments if s.text.strip())


async def _process_omi_memory(uid: str, payload: MemoryWebhookPayload) -> None:
    db.put_health_snapshot({
        "user_id": uid,
        "source": "omi",
        "raw_data": payload.model_dump(mode="json"),
        "dimensions": {"sleep": "grey", "stress": "grey", "meds": "grey"},
        "is_sleeping": False,
        "timestamp": (payload.created_at or datetime.now(timezone.utc)).isoformat(),
    })

    transcript = _stitch_transcript(payload.transcript_segments)
    if not transcript:
        return

    today = (payload.started_at or datetime.now(timezone.utc)).strftime("%Y-%m-%d")
    schedule = db.get_schedule(uid)
    today_logs = db.get_logs(uid, date=today)
    logged_names = {l["medication_name"] for l in today_logs}

    # Path 1 — taken keyword detected → log the medication (before distress to avoid false SMS)
    match = detect_taken(transcript, schedule)
    if match:
        db.put_medication_log({
            "uid": uid,
            "date": today,
            "medication_name": match["medication_name"],
            "dose": match.get("dose"),
            "unit": match.get("unit"),
            "taken_at": datetime.now(timezone.utc).isoformat(),
            "source": "webhook",
            "conversation_id": payload.id,
            "confidence_score": match.get("confidence"),
            "notes": match.get("raw_quote"),
        })
        return

    # Path 2 — distress detected → SMS caregiver about first overdue med
    if detect_distress(transcript) and CAREGIVER_PHONE:
        pending = next((m for m in schedule if m["medication_name"] not in logged_names), None)
        if pending:
            user = db.get_user(uid)
            patient_name = user["name"].replace("'s Egg", "") if user else "Your partner"
            try:
                await send_caregiver_sms(CAREGIVER_PHONE, patient_name, pending["medication_name"])
                logger.info("caregiver SMS sent uid=%s med=%s", uid, pending["medication_name"])
            except Exception as e:
                logger.error("caregiver SMS failed: %s", e)
        return

    # Path 3 — fall back to LLM
    events = await extract_medication_events(transcript, schedule=schedule)
    for event in events:
        db.put_medication_log({
            "uid": uid,
            "date": today,
            "medication_name": event.get("medication_name"),
            "dose": event.get("dose"),
            "unit": event.get("unit"),
            "taken_at": datetime.now(timezone.utc).isoformat(),
            "source": "webhook",
            "conversation_id": payload.id,
            "confidence_score": event.get("confidence"),
            "notes": event.get("raw_quote"),
        })


@router.post("/oura")
async def oura_webhook(request: Request):
    payload = await request.json()
    raise NotImplementedError


@router.post("/omi")
async def omi_webhook(
    payload: MemoryWebhookPayload,
    background_tasks: BackgroundTasks,
    uid: str = Query(...),
):
    """Receive Omi memory webhook. Detects distress → SMS caregiver, or med taken → log."""
    logger.info("omi webhook uid=%s conversation_id=%s discarded=%s", uid, payload.id, payload.discarded)
    logger.debug("omi webhook payload:\n%s", json.dumps(payload.model_dump(), indent=2, default=str))

    if payload.discarded:
        return {"status": "discarded"}

    background_tasks.add_task(_process_omi_memory, uid, payload)
    return {"status": "received", "conversation_id": payload.id}
