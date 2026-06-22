from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class PatientAccessGrant(BaseModel):
    patient_id: str
    user_id: str
    access_level: Literal["viewer", "editor", "owner"] = "viewer"


class PatientAccess(PatientAccessGrant):
    id: str
    granted_by: str
    created_at: datetime


class ActivityEvent(BaseModel):
    id: str
    actor_id: str | None = None
    patient_id: str | None = None
    action: str
    metadata: dict
    created_at: datetime
