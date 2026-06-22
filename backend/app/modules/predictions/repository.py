from app.common.pagination import PaginationParams
from app.core.supabase import get_supabase_admin


class PredictionRepository:
    def __init__(self) -> None:
        self.client = get_supabase_admin()

    def list(self, pagination: PaginationParams) -> list[dict]:
        return (
            self.client.table("predictions")
            .select("*")
            .order("created_at", desc=True)
            .range(pagination.offset, pagination.offset + pagination.limit - 1)
            .execute()
            .data
        )

    def create_many(self, records: list[dict]) -> list[dict]:
        return self.client.table("predictions").insert(records).execute().data

    def delete_all_for_user(self, actor_id: str) -> None:
        self.client.table("predictions").delete().eq("created_by", actor_id).execute()
