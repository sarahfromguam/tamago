from fastapi import APIRouter, HTTPException

from models.invite import InviteAccept, InviteCreate, InviteOut
from services.supabase_client import supabase
from services.twilio_sms import send_invite_sms

router = APIRouter(tags=["invites"])


@router.post("/api/users/{slug}/invite", response_model=InviteOut)
async def send_invite(slug: str, body: InviteCreate):
    """Send an invite SMS to a phone number. Creates an invite record and texts the link."""
    raise NotImplementedError


@router.post("/api/invite/{code}/accept")
async def accept_invite(code: str, body: InviteAccept):
    """Accept an invite. Subscriber enters their phone number to subscribe to the tamago."""
    raise NotImplementedError
