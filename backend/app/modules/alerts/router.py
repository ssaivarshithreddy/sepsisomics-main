from fastapi import APIRouter, Depends

from app.common.pagination import Page, PaginationParams, pagination_params
from app.common.responses import ApiResponse
from app.core.security import CurrentUser, require_roles
from app.modules.alerts.repository import AlertRepository
from app.modules.alerts.schemas import Alert

router = APIRouter()


@router.get("", response_model=ApiResponse[Page[Alert]])
async def list_alerts(
    patient_id: str | None = None,
    pagination: PaginationParams = Depends(pagination_params),
    _: CurrentUser = Depends(require_roles("doctor", "admin")),
) -> ApiResponse[Page[Alert]]:
    data = AlertRepository().list(pagination, patient_id)
    return ApiResponse(data=Page(data=data, limit=pagination.limit, offset=pagination.offset))


@router.post("/{alert_id}/acknowledge", response_model=ApiResponse[Alert])
async def acknowledge_alert(alert_id: str, user: CurrentUser = Depends(require_roles("doctor", "admin"))) -> ApiResponse[Alert]:
    return ApiResponse(data=AlertRepository().acknowledge(alert_id, user.id))
