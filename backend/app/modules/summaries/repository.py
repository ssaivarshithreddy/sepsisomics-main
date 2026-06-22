from app.common.pagination import PaginationParams
from app.core.supabase import get_supabase_admin


class MedicalSummaryRepository:
    def __init__(self) -> None:
        self.client = get_supabase_admin()

    def create(self, record: dict) -> dict:
        return self.client.table("medical_summaries").insert(record).execute().data[0]

    def list_for_patient(self, patient_id: str, pagination: PaginationParams) -> list[dict]:
        return (
            self.client.table("medical_summaries")
            .select("*")
            .eq("patient_id", patient_id)
            .order("created_at", desc=True)
            .range(pagination.offset, pagination.offset + pagination.limit - 1)
            .execute()
            .data
        )
