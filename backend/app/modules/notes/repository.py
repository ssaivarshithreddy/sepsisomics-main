from app.common.pagination import PaginationParams
from app.core.supabase import get_supabase_admin
from app.modules.notes.schemas import NoteCreate


class NoteRepository:
    def __init__(self) -> None:
        self.client = get_supabase_admin()

    def list_for_patient(self, patient_id: str, pagination: PaginationParams) -> list[dict]:
        return (
            self.client.table("notes")
            .select("*")
            .eq("patient_id", patient_id)
            .order("created_at", desc=True)
            .range(pagination.offset, pagination.offset + pagination.limit - 1)
            .execute()
            .data
        )

    def create(self, payload: NoteCreate, actor_id: str) -> dict:
        record = payload.model_dump(mode="json")
        record["author_id"] = actor_id
        return self.client.table("notes").insert(record).execute().data[0]
