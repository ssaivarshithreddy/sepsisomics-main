from fastapi import APIRouter, Depends, HTTPException

from app.common.pagination import Page, PaginationParams, pagination_params
from app.common.responses import ApiResponse
from app.core.security import CurrentUser, require_roles
from app.modules.patients.repository import PatientRepository
from app.modules.patients.schemas import Patient, PatientCreate, PatientUpdate

router = APIRouter()


@router.get("", response_model=ApiResponse[Page[Patient]])
async def list_patients(
    pagination: PaginationParams = Depends(pagination_params),
    _: CurrentUser = Depends(require_roles("doctor", "admin")),
) -> ApiResponse[Page[Patient]]:
    data = PatientRepository().list(pagination)
    return ApiResponse(data=Page(data=data, limit=pagination.limit, offset=pagination.offset))


@router.get("/{patient_id}", response_model=ApiResponse[Patient])
async def get_patient(patient_id: str, _: CurrentUser = Depends(require_roles("doctor", "admin"))) -> ApiResponse[Patient]:
    patient = PatientRepository().get(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return ApiResponse(data=patient)


@router.post("", response_model=ApiResponse[Patient])
async def create_patient(payload: PatientCreate, user: CurrentUser = Depends(require_roles("doctor", "admin"))) -> ApiResponse[Patient]:
    return ApiResponse(data=PatientRepository().create(payload, user.id))


@router.patch("/{patient_id}", response_model=ApiResponse[Patient])
async def update_patient(patient_id: str, payload: PatientUpdate, _: CurrentUser = Depends(require_roles("doctor", "admin"))) -> ApiResponse[Patient]:
    return ApiResponse(data=PatientRepository().update(patient_id, payload))
