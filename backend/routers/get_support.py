import logging
import os
from datetime import datetime, timezone
from fastapi import APIRouter, Query

from services.twilio_message import send_friend_message, send_caregiver_message
from services import db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["get-support"])

CAREGIVER_PHONE = os.environ.get("CAREGIVER_PHONE", "")
FRIEND_PHONE = os.environ.get("FRIEND_PHONE", "")
NGROK_URL = os.environ.get("NGROK_URL", "")


@router.post("/get-support")
async def get_support(uid: str = Query(...), target: str = Query(default="both")):
    """Send WhatsApp to friend (app link) and/or caregiver (medication reminder).

    target: "friend", "caregiver", or "both" (default).
    """
    # DB lookups are best-effort — if Supabase isn't configured the
    # friend/caregiver messages should still be attempted.
    pending = None
    patient_name = "Your partner"
    try:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        schedule = db.get_schedule(uid)
        today_logs = db.get_logs(uid, date=today)
        logged_names = {l["medication_name"] for l in today_logs}
        pending = next((m for m in schedule if m["medication_name"] not in logged_names), None)
        user = db.get_user(uid)
        patient_name = user["name"].replace("'s Egg", "") if user else "Your partner"
    except Exception as e:
        logger.warning("db lookup failed (continuing anyway): %s", e)

    results = {}

    if target in ("friend", "both") and FRIEND_PHONE:
        try:
            await send_friend_message(FRIEND_PHONE, patient_name, NGROK_URL)
            logger.info("friend message sent uid=%s to=%s", uid, FRIEND_PHONE)
            results["friend"] = "sent"
        except Exception as e:
            logger.error("friend message failed: %s", e)
            results["friend"] = f"error: {e}"

    if target in ("caregiver", "both"):
        if CAREGIVER_PHONE and pending:
            try:
                await send_caregiver_message(CAREGIVER_PHONE, patient_name, pending["medication_name"])
                logger.info("caregiver message sent uid=%s med=%s", uid, pending["medication_name"])
                results["caregiver"] = "sent"
            except Exception as e:
                logger.error("caregiver message failed: %s", e)
                results["caregiver"] = f"error: {e}"
        elif not pending:
            results["caregiver"] = "all meds taken"

    return {"status": "ok", **results}
