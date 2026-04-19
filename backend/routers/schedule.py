from fastapi import APIRouter
from models.schedule import MedicationScheduleCreate, MedicationScheduleUpdate
from services import db

router = APIRouter()


@router.get("/schedule")
async def get_schedule(uid: str):
    return db.get_schedule(uid)


@router.post("/schedule", status_code=201)
async def add_medication(body: MedicationScheduleCreate):
    return db.create_schedule_item(body.model_dump())


@router.put("/schedule/{med_id}")
async def update_medication(med_id: str, body: MedicationScheduleUpdate):
    return db.update_schedule_item(med_id, body.model_dump(exclude_none=True))


@router.delete("/schedule/{med_id}", status_code=204)
async def delete_medication(med_id: str):
    db.delete_schedule_item(med_id)
