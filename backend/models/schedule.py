from datetime import date
from pydantic import BaseModel, Field
import uuid


class MedicationSchedule(BaseModel):
    medication_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    uid: str
    medication_name: str
    dose: str
    unit: str | None = None
    frequency: str
    scheduled_times: list[str]
    start_date: date | None = None
    end_date: date | None = None
    reminders_enabled: bool = True


class MedicationScheduleCreate(BaseModel):
    uid: str
    medication_name: str
    dose: str
    unit: str | None = None
    frequency: str
    scheduled_times: list[str]
    start_date: date | None = None
    end_date: date | None = None
    reminders_enabled: bool = True


class MedicationScheduleUpdate(BaseModel):
    medication_name: str | None = None
    dose: str | None = None
    unit: str | None = None
    frequency: str | None = None
    scheduled_times: list[str] | None = None
    end_date: date | None = None
    reminders_enabled: bool | None = None
