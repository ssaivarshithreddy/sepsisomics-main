from fastapi import APIRouter, Depends

from app.common.responses import ApiResponse
from app.core.security import CurrentUser, require_roles
from app.modules.ml.engine import get_ml_engine
from app.modules.ml.preprocessing import DatasetPreprocessor
from app.modules.ml.schemas import ClinicalPredictionInput, ClinicalPredictionOutput, DatasetTransformRequest, DatasetTransformResponse

router = APIRouter()


@router.post("/predict", response_model=ApiResponse[ClinicalPredictionOutput])
async def predict(
    payload: ClinicalPredictionInput,
    _: CurrentUser = Depends(require_roles("doctor", "admin")),
) -> ApiResponse[ClinicalPredictionOutput]:
    result = get_ml_engine().predict(payload.model_dump(exclude_none=True))
    return ApiResponse(data=result)


@router.post("/datasets/transform", response_model=ApiResponse[DatasetTransformResponse])
async def transform_dataset(
    payload: DatasetTransformRequest,
    _: CurrentUser = Depends(require_roles("admin")),
) -> ApiResponse[DatasetTransformResponse]:
    transformed = DatasetPreprocessor().transform_records(payload.records, payload.source)
    return ApiResponse(data=DatasetTransformResponse(source=payload.source, rows=len(transformed), transformed=transformed))
