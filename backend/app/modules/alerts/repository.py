from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from app.common.pagination import PaginationParams
from app.core.supabase import get_supabase_admin
from app.modules.alerts.schemas import AlertCreate


class AlertRepository:
    def __init__(self) -> None:
        self.client = get_supabase_admin()

    def get_alerts(
        self,
        pagination: PaginationParams,
        patient_id: Optional[str] = None,
    ) -> List[dict]:
        query = (
            self.client.table("alerts")
            .select("*")
            .order("created_at", desc=True)
        )

        if patient_id:
            query = query.eq("patient_id", patient_id)

        response = (
            query.range(
                pagination.offset,
                pagination.offset + pagination.limit - 1,
            )
            .execute()
        )

        return response.data

    def create_many(
        self,
        alerts: List[AlertCreate],
    ) -> List[dict]:
        if not alerts:
            return []

        payload = [
            alert.model_dump(mode="json")
            for alert in alerts
        ]

        response = (
            self.client.table("alerts")
            .insert(payload)
            .execute()
        )

        return response.data

    def acknowledge(
        self,
        alert_id: str,
        actor_id: str,
    ) -> dict:
        response = (
            self.client.table("alerts")
            .update(
                {
                    "acknowledged_by": actor_id,
                    "acknowledged_at": datetime.now(
                        timezone.utc
                    ).isoformat(),
                }
            )
            .eq("id", alert_id)
            .execute()
        )

        if not response.data:
            raise ValueError(f"Alert {alert_id} not found")

        return response.data[0]