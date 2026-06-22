from fastapi import APIRouter, BackgroundTasks, Depends

from app.common.pagination import Page, PaginationParams, pagination_params
from app.common.responses import ApiResponse
from app.core.security import CurrentUser, require_roles
from app.modules.alerts.service import AlertService
from app.modules.predictions.schemas import PredictionBatchCreate
from app.modules.predictions.service import PredictionService
from app.modules.vitals.repository import VitalsRepository
from app.modules.vitals.schemas import Vital, VitalCreate

router = APIRouter()


@router.get("/patients/{patient_id}", response_model=ApiResponse[Page[Vital]])
async def patient_vitals(
    patient_id: str,
    pagination: PaginationParams = Depends(pagination_params),
    _: CurrentUser = Depends(require_roles("doctor", "admin")),
) -> ApiResponse[Page[Vital]]:
    data = VitalsRepository().list_for_patient(patient_id, pagination)
    return ApiResponse(data=Page(data=data, limit=pagination.limit, offset=pagination.offset))


@router.post("", response_model=ApiResponse[Vital])
async def create_vital(
    payload: VitalCreate,
    background_tasks: BackgroundTasks,
    user: CurrentUser = Depends(require_roles("doctor", "admin")),
) -> ApiResponse[Vital]:
    vital = VitalsRepository().create(payload, user.id)
    AlertService().evaluate_vital(vital, user.id)
    background_tasks.add_task(_run_prediction_from_vital, vital, user.id)
    return ApiResponse(data=vital)


def _run_prediction_from_vital(vital: dict, actor_id: str) -> None:
    record = {
        "patient_uuid": vital["patient_id"],
        "patient_id": vital["patient_id"],
        "heart_rate": vital.get("heart_rate"),
        "respiratory_rate": vital.get("respiratory_rate"),
        "spo2": vital.get("oxygen_saturation"),
        "temperature": vital.get("temperature_c"),
        "blood_pressure": vital.get("systolic_bp"),
        "lactate_level": vital.get("lactate"),
    }
    PredictionService().create_batch(PredictionBatchCreate(records=[record]), actor_id)
