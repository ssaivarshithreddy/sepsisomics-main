from fastapi import APIRouter, Depends

from app.common.pagination import Page, PaginationParams, pagination_params
from app.common.responses import ApiResponse
from app.core.security import CurrentUser, require_roles
from app.modules.summaries.repository import MedicalSummaryRepository
from app.modules.summaries.schemas import MedicalSummary
from app.modules.summaries.service import MedicalSummaryService

router = APIRouter()


@router.get("/patients/{patient_id}", response_model=ApiResponse[Page[MedicalSummary]])
async def patient_summaries(
    patient_id: str,
    pagination: PaginationParams = Depends(pagination_params),
    _: CurrentUser = Depends(require_roles("doctor", "admin")),
) -> ApiResponse[Page[MedicalSummary]]:
    data = MedicalSummaryRepository().list_for_patient(patient_id, pagination)
    return ApiResponse(data=Page(data=data, limit=pagination.limit, offset=pagination.offset))


@router.post("/patients/{patient_id}", response_model=ApiResponse[MedicalSummary])
async def generate_summary(patient_id: str, user: CurrentUser = Depends(require_roles("doctor", "admin"))) -> ApiResponse[MedicalSummary]:
    return ApiResponse(data=MedicalSummaryService().create_for_patient(patient_id, user.id))
