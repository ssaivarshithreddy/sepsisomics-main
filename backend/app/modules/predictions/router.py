from fastapi import APIRouter, Depends, status

from app.common.pagination import Page, PaginationParams, pagination_params
from app.common.responses import ApiResponse
from app.core.security import CurrentUser, require_roles
from app.modules.predictions.repository import PredictionRepository
from app.modules.predictions.schemas import Prediction, PredictionBatchCreate
from app.modules.predictions.service import PredictionService

router = APIRouter()


@router.get("", response_model=ApiResponse[Page[Prediction]])
async def list_predictions(
    pagination: PaginationParams = Depends(pagination_params),
    _: CurrentUser = Depends(require_roles("doctor", "admin")),
) -> ApiResponse[Page[Prediction]]:
    data = PredictionRepository().list(pagination)
    return ApiResponse(data=Page(data=data, limit=pagination.limit, offset=pagination.offset))


@router.post("/batch", response_model=ApiResponse[list[Prediction]], status_code=status.HTTP_201_CREATED)
async def create_prediction_batch(
    payload: PredictionBatchCreate,
    user: CurrentUser = Depends(require_roles("doctor", "admin")),
) -> ApiResponse[list[Prediction]]:
    return ApiResponse(data=PredictionService().create_batch(payload, user.id))


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def clear_predictions(user: CurrentUser = Depends(require_roles("doctor", "admin"))) -> None:
    PredictionRepository().delete_all_for_user(user.id)
