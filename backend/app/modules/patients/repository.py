from app.common.pagination import PaginationParams
from app.core.supabase import get_supabase_admin
from app.modules.patients.schemas import PatientCreate, PatientUpdate


class PatientRepository:
    def __init__(self) -> None:
        self.client = get_supabase_admin()

    def list(self, pagination: PaginationParams) -> list[dict]:
        return (
            self.client.table("patients")
            .select("*")
            .order("created_at", desc=True)
            .range(pagination.offset, pagination.offset + pagination.limit - 1)
            .execute()
            .data
        )

    def get(self, patient_id: str) -> dict | None:
        data = self.client.table("patients").select("*").eq("id", patient_id).limit(1).execute().data
        return data[0] if data else None

    def create(self, payload: PatientCreate, actor_id: str) -> dict:
        record = payload.model_dump(mode="json")
        record["created_by"] = actor_id
        return self.client.table("patients").insert(record).execute().data[0]

    def update(self, patient_id: str, payload: PatientUpdate) -> dict:
        record = payload.model_dump(exclude_unset=True, mode="json")
        return self.client.table("patients").update(record).eq("id", patient_id).execute().data[0]
