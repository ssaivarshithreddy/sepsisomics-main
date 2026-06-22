import asyncio

from app.core.cache import queue_push
from app.core.config import settings
from app.modules.notifications.repository import NotificationRepository


class NotificationService:
    def __init__(self) -> None:
        self.repository = NotificationRepository()

    def register_device(self, user_id: str, platform: str, token: str) -> dict:
        return self.repository.register_device({"user_id": user_id, "platform": platform, "token": token})

    def queue_critical_alert(self, alert: dict) -> dict:
        delivery = self.repository.create_delivery(
            {
                "patient_id": alert.get("patient_id"),
                "alert_id": alert.get("id"),
                "title": alert.get("title", "Critical patient alert"),
                "body": alert.get("message", "Critical patient notification"),
                "status": "queued",
                "attempts": 0,
            }
        )
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(queue_push("notifications:critical", delivery))
        except RuntimeError:
            pass
        return delivery

    async def dispatch_delivery(self, delivery: dict) -> dict:
        delivery["attempts"] = min(settings.notification_retry_attempts, int(delivery.get("attempts") or 0) + 1)
        delivery["status"] = "queued_for_provider"
        return delivery
