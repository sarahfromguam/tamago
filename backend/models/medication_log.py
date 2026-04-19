from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field
import uuid


class LogSource(str, Enum):
    webhook = "webhook"
    manual = "manual"


class MedicationLog(BaseModel):
    log_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    uid: str
    medication_name: str
    dose: str | None = None
    unit: str | None = None
    taken_at: datetime | None = None
    source: LogSource = LogSource.manual
    conversation_id: str | None = None
    confidence_score: float | None = None
    notes: str | None = None


class MedicationLogCreate(BaseModel):
    uid: str
    medication_name: str
    dose: str | None = None
    unit: str | None = None
    taken_at: datetime | None = None
    notes: str | None = None
