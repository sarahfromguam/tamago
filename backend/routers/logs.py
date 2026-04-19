from fastapi import APIRouter
from models.medication_log import MedicationLogCreate
from services import db

router = APIRouter()


@router.get("/logs")
async def list_logs(uid: str, date: str | None = None):
    logs = db.get_logs(uid, date=date)
    return logs


@router.get("/logs/{log_id}")
async def get_log(log_id: str):
    log = db.get_log(log_id)
    return log


@router.post("/logs", status_code=201)
async def create_log(body: MedicationLogCreate):
    log = db.put_medication_log({
        "uid": body.uid,
        "date": body.taken_at.strftime("%Y-%m-%d") if body.taken_at else None,
        "medication_name": body.medication_name,
        "dose": body.dose,
        "unit": body.unit,
        "taken_at": body.taken_at.isoformat() if body.taken_at else None,
        "source": "manual",
        "notes": body.notes,
    })
    return log
