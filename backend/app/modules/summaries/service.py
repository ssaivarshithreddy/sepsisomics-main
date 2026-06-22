from app.core.supabase import get_supabase_admin
from app.modules.summaries.repository import MedicalSummaryRepository


class MedicalSummaryService:
    def __init__(self) -> None:
        self.client = get_supabase_admin()
        self.repository = MedicalSummaryRepository()

    def create_for_patient(self, patient_id: str, actor_id: str | None = None) -> dict:
        vitals = (
            self.client.table("vitals")
            .select("*")
            .eq("patient_id", patient_id)
            .order("measured_at", desc=True)
            .limit(1)
            .execute()
            .data
        )
        predictions = (
            self.client.table("predictions")
            .select("*")
            .eq("patient_id", patient_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
            .data
        )
        alerts = (
            self.client.table("alerts")
            .select("*")
            .eq("patient_id", patient_id)
            .is_("acknowledged_at", "null")
            .order("created_at", desc=True)
            .limit(3)
            .execute()
            .data
        )
        body, severity = self._compose(vitals[0] if vitals else None, predictions[0] if predictions else None, alerts)
        return self.repository.create(
            {"patient_id": patient_id, "body": body, "severity": severity, "source": "rules-ai-foundation", "created_by": actor_id}
        )

    @staticmethod
    def _compose(vital: dict | None, prediction: dict | None, alerts: list[dict]) -> tuple[str, str]:
        result = prediction.get("result", {}) if prediction else {}
        deterioration = float(result.get("deterioration_risk") or 0)
        mortality = float(result.get("mortality_risk") or 0)
        sepsis = float(result.get("sepsis_probability") or result.get("probability") or 0)
        alert_count = len(alerts)

        if deterioration >= 0.75 or sepsis >= 0.75 or alert_count >= 2:
            return "Patient vitals and predictive risk are worsening. Recommend urgent ICU evaluation and senior clinical review.", "critical"
        if deterioration >= 0.5 or mortality >= 0.4 or alert_count:
            return "Patient shows elevated clinical risk. Recommend close monitoring, repeat vitals, and review sepsis pathway.", "warning"
        if vital:
            return "Patient currently appears clinically stable based on latest vitals and prediction results. Continue routine monitoring.", "info"
        return "Insufficient recent clinical data. Recommend updating vitals and reviewing patient status.", "info"
