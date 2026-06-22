from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class FeatureContribution(BaseModel):
    key: str
    label: str
    category: str
    value: float
    zScore: float
    contribution: float
    importance: float
    description: str
    status: Literal["normal", "abnormal-high", "abnormal-low"]


class PredictionResult(BaseModel):
    sepsis: bool
    probability: float
    severity: Literal["Low", "Moderate", "Severe"]
    severityScore: float
    contributions: list[FeatureContribution]
    topDrivers: list[FeatureContribution]
    summary: str


class PredictionCreate(BaseModel):
    patient_id: str | None = None
    record: dict[str, Any] = Field(default_factory=dict)


class PredictionBatchCreate(BaseModel):
    records: list[dict[str, Any]] = Field(min_length=1, max_length=500)


class Prediction(BaseModel):
    id: str
    patient_id: str | None = None
    patient_identifier: str
    record: dict[str, Any]
    result: PredictionResult
    created_at: datetime
    created_by: str | None = None
