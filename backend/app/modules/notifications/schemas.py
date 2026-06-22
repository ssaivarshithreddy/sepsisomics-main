from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class NotificationDeviceCreate(BaseModel):
    platform: Literal["ios", "android", "web"]
    token: str = Field(min_length=10)


class NotificationDevice(NotificationDeviceCreate):
    id: str
    user_id: str
    created_at: datetime


class NotificationDelivery(BaseModel):
    id: str
    user_id: str | None = None
    patient_id: str | None = None
    alert_id: str | None = None
    title: str
    body: str
    status: str
    attempts: int
    created_at: datetime
