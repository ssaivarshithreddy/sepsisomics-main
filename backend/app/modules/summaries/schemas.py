from datetime import datetime

from pydantic import BaseModel


class MedicalSummary(BaseModel):
    id: str
    patient_id: str
    body: str
    severity: str
    source: str
    created_by: str | None = None
    created_at: datetime
