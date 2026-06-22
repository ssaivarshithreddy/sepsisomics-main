from app.common.pagination import PaginationParams
from app.core.supabase import get_supabase_admin


class CollaborationRepository:
    def __init__(self) -> None:
        self.client = get_supabase_admin()

    def grant_access(self, record: dict) -> dict:
        return self.client.table("patient_access").upsert(record, on_conflict="patient_id,user_id").execute().data[0]

    def list_access(self, patient_id: str) -> list[dict]:
        return self.client.table("patient_access").select("*").eq("patient_id", patient_id).execute().data

    def record_activity(self, record: dict) -> dict:
        return self.client.table("activity_events").insert(record).execute().data[0]

    def list_activity(self, pagination: PaginationParams, patient_id: str | None = None) -> list[dict]:
        query = self.client.table("activity_events").select("*").order("created_at", desc=True)
        if patient_id:
            query = query.eq("patient_id", patient_id)
        return query.range(pagination.offset, pagination.offset + pagination.limit - 1).execute().data
