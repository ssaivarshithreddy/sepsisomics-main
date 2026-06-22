from fastapi import APIRouter, Depends

from app.common.pagination import Page, PaginationParams, pagination_params
from app.common.responses import ApiResponse
from app.core.security import CurrentUser, require_roles
from app.modules.notifications.repository import NotificationRepository
from app.modules.notifications.schemas import NotificationDelivery, NotificationDevice, NotificationDeviceCreate
from app.modules.notifications.service import NotificationService

router = APIRouter()


@router.post("/devices", response_model=ApiResponse[NotificationDevice])
async def register_device(
    payload: NotificationDeviceCreate,
    user: CurrentUser = Depends(require_roles("doctor", "admin")),
) -> ApiResponse[NotificationDevice]:
    return ApiResponse(data=NotificationService().register_device(user.id, payload.platform, payload.token))


@router.get("/deliveries", response_model=ApiResponse[Page[NotificationDelivery]])
async def deliveries(
    pagination: PaginationParams = Depends(pagination_params),
    _: CurrentUser = Depends(require_roles("admin")),
) -> ApiResponse[Page[NotificationDelivery]]:
    data = NotificationRepository().list_deliveries(pagination)
    return ApiResponse(data=Page(data=data, limit=pagination.limit, offset=pagination.offset))
