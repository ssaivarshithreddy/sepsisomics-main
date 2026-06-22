from datetime import datetime

from pydantic import BaseModel, Field


class VitalCreate(BaseModel):
    patient_id: str
    heart_rate: float | None = Field(default=None, ge=0)
    respiratory_rate: float | None = Field(default=None, ge=0)
    oxygen_saturation: float | None = Field(default=None, ge=0, le=100)
    temperature_c: float | None = Field(default=None, ge=25, le=45)
    systolic_bp: float | None = Field(default=None, ge=0)
    diastolic_bp: float | None = Field(default=None, ge=0)
    lactate: float | None = Field(default=None, ge=0)
    measured_at: datetime | None = None


class Vital(VitalCreate):
    id: str
    created_at: datetime
    recorded_by: str | None = None
