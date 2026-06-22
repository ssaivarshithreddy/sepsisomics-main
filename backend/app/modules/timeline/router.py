from fastapi import APIRouter, Depends

from app.common.pagination import Page, PaginationParams, pagination_params
from app.common.responses import ApiResponse
from app.core.security import CurrentUser, require_roles
from app.modules.timeline.repository import TimelineRepository
from app.modules.timeline.schemas import TimelinePoint

router = APIRouter()


@router.get("/patients/{patient_id}", response_model=ApiResponse[Page[TimelinePoint]])
async def patient_timeline(
    patient_id: str,
    pagination: PaginationParams = Depends(pagination_params),
    _: CurrentUser = Depends(require_roles("doctor", "admin")),
) -> ApiResponse[Page[TimelinePoint]]:
    data = TimelineRepository().list_for_patient(patient_id, pagination)
    return ApiResponse(data=Page(data=data, limit=pagination.limit, offset=pagination.offset))
