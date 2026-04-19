from fastapi import APIRouter

router = APIRouter()


@router.get("/adherence")
async def get_adherence(uid: str, range: str = "7d"):
    # TODO: aggregate DynamoDB logs vs schedule
    return {"uid": uid, "range": range, "adherence": {}}


@router.post("/reminders", status_code=202)
async def trigger_reminder(uid: str, med_id: str):
    # TODO: call twilio_sms.send_reminder
    return {"status": "queued"}
