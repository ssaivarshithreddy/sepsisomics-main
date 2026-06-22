from datetime import datetime
from typing import Literal

from pydantic import BaseModel


AlertSeverity = Literal["info", "warning", "critical"]


class AlertCreate(BaseModel):
    patient_id: str
    source: str
    severity: AlertSeverity
    title: str
    message: str
    escalation_level: int = 0
    metadata: dict = {}


class Alert(AlertCreate):
    id: str
    acknowledged_at: datetime | None = None
    acknowledged_by: str | None = None
    created_at: datetime
