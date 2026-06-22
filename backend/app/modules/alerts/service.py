from app.modules.alerts.repository import AlertRepository
from app.modules.alerts.schemas import AlertCreate
from app.modules.notifications.service import NotificationService


class AlertService:
    def __init__(self) -> None:
        self.repository = AlertRepository()
        self.notifications = NotificationService()

    def evaluate_vital(self, vital: dict, actor_id: str) -> list[dict]:
        alerts: list[AlertCreate] = []
        patient_id = vital["patient_id"]

        oxygen = vital.get("oxygen_saturation")
        if oxygen is not None and oxygen < 92:
            alerts.append(
                AlertCreate(
                    patient_id=patient_id,
                    source="vitals",
                    severity="critical" if oxygen < 88 else "warning",
                    title="Oxygen saturation drop",
                    message=f"Oxygen saturation recorded at {oxygen}%.",
                    escalation_level=2 if oxygen < 88 else 1,
                    metadata={"vital_id": vital["id"], "oxygen_saturation": oxygen, "created_by": actor_id},
                )
            )

        temperature = vital.get("temperature_c")
        if temperature is not None and temperature >= 38.5:
            alerts.append(
                AlertCreate(
                    patient_id=patient_id,
                    source="vitals",
                    severity="warning" if temperature < 40 else "critical",
                    title="Fever spike",
                    message=f"Temperature recorded at {temperature} C.",
                    escalation_level=2 if temperature >= 40 else 1,
                    metadata={"vital_id": vital["id"], "temperature_c": temperature, "created_by": actor_id},
                )
            )

        systolic = vital.get("systolic_bp")
        heart_rate = vital.get("heart_rate")
        respiratory = vital.get("respiratory_rate")
        lactate = vital.get("lactate")
        if (systolic is not None and systolic < 90) or (heart_rate is not None and heart_rate > 130) or (respiratory is not None and respiratory > 30) or (lactate is not None and lactate >= 4):
            alerts.append(
                AlertCreate(
                    patient_id=patient_id,
                    source="vitals",
                    severity="critical",
                    title="Critical patient condition",
                    message="Vitals meet critical sepsis monitoring thresholds.",
                    escalation_level=3,
                    metadata={"vital_id": vital["id"], "created_by": actor_id},
                )
            )

        created = self.repository.create_many(alerts)
        for alert in created:
            if alert.get("severity") == "critical":
                self.notifications.queue_critical_alert(alert)
        return created

    def evaluate_prediction(self, patient_id: str, prediction: dict) -> list[dict]:
        result = prediction.get("result", {})
        deterioration = float(result.get("deterioration_risk") or 0)
        mortality = float(result.get("mortality_risk") or 0)
        probability = float(result.get("sepsis_probability") or result.get("probability") or 0)
        if max(deterioration, mortality, probability) < 0.65:
            return []

        severity = "critical" if max(deterioration, mortality, probability) >= 0.82 else "warning"
        alert = AlertCreate(
            patient_id=patient_id,
            source="ai_prediction",
            severity=severity,
            title="AI risk escalation",
            message="AI model detected elevated sepsis, mortality, or deterioration risk.",
            escalation_level=3 if severity == "critical" else 2,
            metadata={
                "prediction_id": prediction.get("id"),
                "sepsis_probability": probability,
                "mortality_risk": mortality,
                "deterioration_risk": deterioration,
            },
        )
        created = self.repository.create_many([alert])
        for item in created:
            if item.get("severity") == "critical":
                self.notifications.queue_critical_alert(item)
        return created
