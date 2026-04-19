from fastapi import APIRouter, HTTPException

from models.invite import InviteAccept, InviteCreate, InviteOut
from services.supabase_client import get_supabase
from services.twilio_sms import send_invite_sms

router = APIRouter(tags=["invites"])


@router.post("/api/users/{slug}/invite", response_model=InviteOut)
async def send_invite(slug: str, body: InviteCreate):
    """Send an invite SMS to a phone number. Creates an invite record and texts the link."""
    db = get_supabase()

    user_row = db.table("users").select("id, name").eq("slug", slug).maybe_single().execute()
    if not user_row.data:
        raise HTTPException(status_code=404, detail="User not found")

    user = user_row.data

    invite_row = (
        db.table("invites")
        .insert({"user_id": user["id"], "invitee_phone": body.invitee_phone})
        .execute()
    )
    invite = invite_row.data[0]

    invite_url = f"https://tamago.app/invite/{invite['invite_code']}"

    await send_invite_sms(
        to_phone=body.invitee_phone,
        invite_url=invite_url,
        tamago_name=user["name"],
    )

    return invite


@router.post("/api/invite/{code}/accept")
async def accept_invite(code: str, body: InviteAccept):
    """Accept an invite. Subscriber enters their phone number to subscribe to the tamago."""
    db = get_supabase()

    invite_row = (
        db.table("invites")
        .select("*")
        .eq("invite_code", code)
        .eq("status", "pending")
        .maybe_single()
        .execute()
    )
    if not invite_row.data:
        raise HTTPException(status_code=404, detail="Invite not found or already accepted")

    db.table("invites").update({"status": "accepted"}).eq("invite_code", code).execute()

    db.table("supporters").insert(
        {"user_id": invite_row.data["user_id"], "phone": body.phone}
    ).execute()

    return {"status": "accepted"}
