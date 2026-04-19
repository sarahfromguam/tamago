import json
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, BackgroundTasks, Query, Request
from pydantic import BaseModel

from services.claude_extractor import extract_medication_events
from services import db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhook", tags=["webhooks"])


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

    events = await extract_medication_events(transcript)
    today = (payload.started_at or datetime.now(timezone.utc)).strftime("%Y-%m-%d")

    for event in events:
        db.put_medication_log({
            "uid": uid,
            "date": today,
            "medication_name": event.get("medication_name"),
            "dose": event.get("dose"),
            "unit": event.get("unit"),
            "taken_at": event.get("taken_at"),
            "source": "webhook",
            "conversation_id": payload.id,
            "confidence_score": event.get("confidence"),
            "notes": event.get("raw_quote"),
        })


@router.post("/oura")
async def oura_webhook(request: Request):
    """Receive Oura data webhook. Processes sleep/HRV/stress data and updates health snapshot."""
    payload = await request.json()
    raise NotImplementedError


@router.post("/omi")
async def omi_webhook(
    payload: MemoryWebhookPayload,
    background_tasks: BackgroundTasks,
    uid: str = Query(...),
):
    """Receive Omi memory webhook. Extracts medication info from voice transcript using Claude."""
    logger.info("omi webhook received uid=%s conversation_id=%s discarded=%s", uid, payload.id, payload.discarded)
    logger.debug("omi webhook payload:\n%s", json.dumps(payload.model_dump(), indent=2, default=str))

    if payload.discarded:
        return {"status": "discarded"}

    background_tasks.add_task(_process_omi_memory, uid, payload)
    return {"status": "received", "conversation_id": payload.id}
