from datetime import datetime

from pydantic import BaseModel


class TimelinePoint(BaseModel):
    patient_id: str
    prediction_id: str | None = None
    deterioration_risk: float
    septic_shock_risk: float
    mortality_risk: float
    estimated_deterioration_minutes: int | None = None
    created_at: datetime
