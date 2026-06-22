from app.modules.collaboration.repository import CollaborationRepository


class ActivityService:
    def __init__(self) -> None:
        self.repository = CollaborationRepository()

    def record(self, action: str, actor_id: str | None = None, patient_id: str | None = None, metadata: dict | None = None) -> dict:
        return self.repository.record_activity(
            {"actor_id": actor_id, "patient_id": patient_id, "action": action, "metadata": metadata or {}}
        )
