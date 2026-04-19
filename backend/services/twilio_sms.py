"""Twilio SMS integration for sending invite links."""

import os

from twilio.rest import Client

TWILIO_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM = os.environ.get("TWILIO_PHONE_NUMBER", "")

client = Client(TWILIO_SID, TWILIO_TOKEN) if TWILIO_SID else None


async def send_invite_sms(to_phone: str, invite_url: str, tamago_name: str) -> None:
    """Send an SMS invite link to a supporter."""
    if not client:
        raise RuntimeError("Twilio credentials not configured")

    body = (
        f"You've been invited to support {tamago_name} on Tamago! "
        f"Tap here to accept: {invite_url}"
    )

    client.messages.create(
        body=body,
        from_=TWILIO_FROM,
        to=to_phone,
    )


async def send_dire_alert_sms(to_phone: str, tamago_name: str, reason: str) -> None:
    """Send an urgent SMS to a primary caregiver when a tamago is in critical condition."""
    if not client:
        raise RuntimeError("Twilio credentials not configured")

    body = (
        f"URGENT — {tamago_name}'s Tamago is in critical condition: {reason}. "
        f"Please check in on them as soon as possible."
    )

    client.messages.create(
        body=body,
        from_=TWILIO_FROM,
        to=to_phone,
    )
