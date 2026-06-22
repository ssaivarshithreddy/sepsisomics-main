from app.modules.alerts.schemas import AlertCreate
from app.modules.alerts.service import AlertService
from app.modules.ml.engine import get_ml_engine
from app.modules.predictions.model import score_record
from app.modules.predictions.repository import PredictionRepository
from app.modules.predictions.schemas import PredictionBatchCreate
from app.modules.summaries.service import MedicalSummaryService
from app.modules.timeline.service import TimelineService


class PredictionService:
    def __init__(self) -> None:
        self.repository = PredictionRepository()
        self.alerts = AlertService()

    def create_batch(self, payload: PredictionBatchCreate, actor_id: str) -> list[dict]:
        rows: list[dict] = []
        pending_alerts: list[AlertCreate] = []
        for idx, record in enumerate(payload.records):
            patient_identifier = str(record.get("patient_id") or record.get("id") or f"Patient {idx + 1}")
            legacy_result = score_record(record)
            ml_result = get_ml_engine().predict(record)
            result = {
                **legacy_result,
                "sepsis_probability": ml_result["sepsis_probability"],
                "mortality_risk": ml_result["mortality_risk"],
                "deterioration_risk": ml_result["deterioration_risk"],
                "model_version": ml_result["model_version"],
                "features": ml_result["features"],
            }
            result["probability"] = ml_result["sepsis_probability"]
            result["sepsis"] = ml_result["sepsis_probability"] >= 0.5
            result["severityScore"] = max(legacy_result["severityScore"], ml_result["deterioration_risk"])
            result["severity"] = "Severe" if result["severityScore"] >= 0.75 else "Moderate" if result["severityScore"] >= 0.5 else "Low"
            rows.append(
                {
                    "patient_id": record.get("patient_uuid") or None,
                    "patient_identifier": patient_identifier,
                    "record": record,
                    "result": result,
                    "model_version": ml_result["model_version"],
                    "created_by": actor_id,
                }
            )
            if result["sepsis"] and result["severity"] in {"Moderate", "Severe"} and record.get("patient_uuid"):
                pending_alerts.append(
                    AlertCreate(
                        patient_id=record["patient_uuid"],
                        source="prediction",
                        severity="critical" if result["severity"] == "Severe" else "warning",
                        title=f"{result['severity']} sepsis prediction",
                        message=result["summary"],
                        metadata={"patient_identifier": patient_identifier, "probability": result["probability"]},
                    )
                )
        created = self.repository.create_many(rows)
        created_alerts = self.alerts.repository.create_many(pending_alerts)
        for alert in created_alerts:
            if alert.get("severity") == "critical":
                self.alerts.notifications.queue_critical_alert(alert)
        for prediction in created:
            if prediction.get("patient_id"):
                TimelineService().record_prediction(prediction)
                self.alerts.evaluate_prediction(prediction["patient_id"], prediction)
                MedicalSummaryService().create_for_patient(prediction["patient_id"], actor_id)
        return created
