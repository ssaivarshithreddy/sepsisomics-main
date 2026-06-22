from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class PatientBase(BaseModel):
    medical_record_number: str | None = None
    display_name: str
    date_of_birth: date | None = None
    sex: Literal["female", "male", "other", "unknown"] = "unknown"
    status: Literal["active", "discharged", "deceased", "archived"] = "active"


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    medical_record_number: str | None = None
    display_name: str | None = None
    date_of_birth: date | None = None
    sex: Literal["female", "male", "other", "unknown"] | None = None
    status: Literal["active", "discharged", "deceased", "archived"] | None = None


class Patient(PatientBase):
    id: str
    created_at: datetime
    updated_at: datetime
