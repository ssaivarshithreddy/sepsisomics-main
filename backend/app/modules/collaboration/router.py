from fastapi import APIRouter, Depends

from app.common.pagination import Page, PaginationParams, pagination_params
from app.common.responses import ApiResponse
from app.core.security import CurrentUser, require_roles
from app.modules.collaboration.repository import CollaborationRepository
from app.modules.collaboration.schemas import ActivityEvent, PatientAccess, PatientAccessGrant
from app.modules.collaboration.service import ActivityService

router = APIRouter()


@router.post("/access", response_model=ApiResponse[PatientAccess])
async def grant_access(payload: PatientAccessGrant, user: CurrentUser = Depends(require_roles("admin"))) -> ApiResponse[PatientAccess]:
    record = payload.model_dump(mode="json")
    record["granted_by"] = user.id
    created = CollaborationRepository().grant_access(record)
    ActivityService().record("patient_access.granted", user.id, payload.patient_id, {"user_id": payload.user_id})
    return ApiResponse(data=created)


@router.get("/patients/{patient_id}/access", response_model=ApiResponse[list[PatientAccess]])
async def patient_access(patient_id: str, _: CurrentUser = Depends(require_roles("doctor", "admin"))) -> ApiResponse[list[PatientAccess]]:
    return ApiResponse(data=CollaborationRepository().list_access(patient_id))


@router.get("/activity", response_model=ApiResponse[Page[ActivityEvent]])
async def activity(
    patient_id: str | None = None,
    pagination: PaginationParams = Depends(pagination_params),
    _: CurrentUser = Depends(require_roles("doctor", "admin")),
) -> ApiResponse[Page[ActivityEvent]]:
    data = CollaborationRepository().list_activity(pagination, patient_id)
    return ApiResponse(data=Page(data=data, limit=pagination.limit, offset=pagination.offset))
