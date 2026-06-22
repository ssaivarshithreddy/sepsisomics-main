from app.common.pagination import PaginationParams
from app.core.supabase import get_supabase_admin


class NotificationRepository:
    def __init__(self) -> None:
        self.client = get_supabase_admin()

    def register_device(self, record: dict) -> dict:
        return self.client.table("notification_devices").upsert(record, on_conflict="token").execute().data[0]

    def create_delivery(self, record: dict) -> dict:
        return self.client.table("notification_deliveries").insert(record).execute().data[0]

    def list_deliveries(self, pagination: PaginationParams) -> list[dict]:
        return (
            self.client.table("notification_deliveries")
            .select("*")
            .order("created_at", desc=True)
            .range(pagination.offset, pagination.offset + pagination.limit - 1)
            .execute()
            .data
        )
