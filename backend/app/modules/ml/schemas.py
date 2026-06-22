from typing import Any, Literal

from pydantic import BaseModel, Field


class ClinicalPredictionInput(BaseModel):
    heart_rate: float | None = None
    blood_pressure: float | None = None
    spo2: float | None = None
    respiratory_rate: float | None = None
    temperature: float | None = None
    wbc_count: float | None = None
    lactate_level: float | None = None


class ClinicalPredictionOutput(BaseModel):
    sepsis_probability: float
    mortality_risk: float
    deterioration_risk: float
    features: dict[str, float]
    model_version: str


class DatasetTransformRequest(BaseModel):
    source: Literal["mimic-iv", "physionet", "generic"] = "generic"
    records: list[dict[str, Any]] = Field(min_length=1, max_length=1000)


class DatasetTransformResponse(BaseModel):
    source: str
    rows: int
    transformed: list[dict[str, Any]]
