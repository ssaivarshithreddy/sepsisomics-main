from app.common.pagination import PaginationParams
from app.core.supabase import get_supabase_admin
from app.modules.vitals.schemas import VitalCreate


class VitalsRepository:
    def __init__(self) -> None:
        self.client = get_supabase_admin()

    def list_for_patient(self, patient_id: str, pagination: PaginationParams) -> list[dict]:
        return (
            self.client.table("vitals")
            .select("*")
            .eq("patient_id", patient_id)
            .order("measured_at", desc=True)
            .range(pagination.offset, pagination.offset + pagination.limit - 1)
            .execute()
            .data
        )

    def create(self, payload: VitalCreate, actor_id: str) -> dict:
        record = payload.model_dump(exclude_none=True, mode="json")
        record["recorded_by"] = actor_id
        return self.client.table("vitals").insert(record).execute().data[0]
