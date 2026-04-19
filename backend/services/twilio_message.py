"""WhatsApp messaging via Twilio sandbox (no A2P registration required)."""

import os
from twilio.rest import Client

TWILIO_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
WHATSAPP_FROM = "whatsapp:+14155238886"  # Twilio WhatsApp sandbox number

client = Client(TWILIO_SID, TWILIO_TOKEN) if TWILIO_SID else None


def _send(to: str, body: str) -> None:
    if not client:
        raise RuntimeError("Twilio credentials not configured")
    client.messages.create(body=body, from_=WHATSAPP_FROM, to=f"whatsapp:{to}")


async def send_invite_message(to_phone: str, invite_url: str, tamago_name: str) -> None:
    body = (
        f"You've been invited to support {tamago_name} on Tamago! "
        f"Tap here to accept: {invite_url}"
    )
    _send(to_phone, body)


async def send_friend_message(to_phone: str, patient_name: str, app_url: str) -> None:
    body = (
        f"Hey! {patient_name} could use some support right now. "
        f"Check in on them here \U0001f95a\n{app_url}"
    )
    _send(to_phone, body)


async def send_caregiver_message(to_phone: str, patient_name: str, medication_name: str) -> None:
    body = (
        f"{patient_name} mentioned not feeling well \U0001f915 "
        f"and has an overdue {medication_name} dose. "
        f"Can you bring it to them?"
    )
    _send(to_phone, body)
