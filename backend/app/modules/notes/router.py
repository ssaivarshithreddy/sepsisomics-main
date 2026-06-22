from fastapi import APIRouter, Depends

from app.common.pagination import Page, PaginationParams, pagination_params
from app.common.responses import ApiResponse
from app.core.security import CurrentUser, require_roles
from app.modules.collaboration.service import ActivityService
from app.modules.notes.repository import NoteRepository
from app.modules.notes.schemas import Note, NoteCreate

router = APIRouter()


@router.get("/patients/{patient_id}", response_model=ApiResponse[Page[Note]])
async def patient_notes(
    patient_id: str,
    pagination: PaginationParams = Depends(pagination_params),
    _: CurrentUser = Depends(require_roles("doctor", "admin")),
) -> ApiResponse[Page[Note]]:
    data = NoteRepository().list_for_patient(patient_id, pagination)
    return ApiResponse(data=Page(data=data, limit=pagination.limit, offset=pagination.offset))


@router.post("", response_model=ApiResponse[Note])
async def create_note(payload: NoteCreate, user: CurrentUser = Depends(require_roles("doctor", "admin"))) -> ApiResponse[Note]:
    note = NoteRepository().create(payload, user.id)
    ActivityService().record("note.created", user.id, payload.patient_id, {"note_id": note["id"]})
    return ApiResponse(data=note)
