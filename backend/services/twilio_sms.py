"""Twilio SMS integration for sending invite links."""

import os

from twilio.rest import Client

TWILIO_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM = os.environ.get("TWILIO_FROM_NUMBER", "")

client = Client(TWILIO_SID, TWILIO_TOKEN) if TWILIO_SID else None


async def send_invite_sms(to_phone: str, invite_url: str, tamago_name: str) -> None:
    """Send an SMS invite link to a supporter."""
    raise NotImplementedError
