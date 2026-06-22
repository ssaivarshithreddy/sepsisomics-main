from app.modules.timeline.repository import TimelineRepository


class TimelineService:
    def __init__(self) -> None:
        self.repository = TimelineRepository()

    def record_prediction(self, prediction: dict) -> dict:
        result = prediction["result"]
        deterioration = float(result.get("deterioration_risk") or result.get("severityScore") or 0)
        mortality = float(result.get("mortality_risk") or 0)
        shock = min(1.0, deterioration * 0.65 + mortality * 0.35)
        eta = self._estimate_minutes(deterioration, shock)
        return self.repository.create(
            {
                "patient_id": prediction["patient_id"],
                "prediction_id": prediction["id"],
                "deterioration_risk": deterioration,
                "septic_shock_risk": shock,
                "mortality_risk": mortality,
                "estimated_deterioration_minutes": eta,
            }
        )

    @staticmethod
    def _estimate_minutes(deterioration_risk: float, shock_risk: float) -> int | None:
        risk = max(deterioration_risk, shock_risk)
        if risk < 0.35:
            return None
        if risk >= 0.85:
            return 30
        if risk >= 0.7:
            return 90
        if risk >= 0.5:
            return 240
        return 480
