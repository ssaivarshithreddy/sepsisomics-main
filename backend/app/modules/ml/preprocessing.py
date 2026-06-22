from datetime import datetime
from typing import Any, Literal

from app.modules.ml.features import engineered_features, extract_features


class DatasetPreprocessor:
    def transform_records(self, records: list[dict[str, Any]], source: Literal["mimic-iv", "physionet", "generic"] = "generic") -> list[dict[str, Any]]:
        transformed: list[dict[str, Any]] = []
        for record in records:
            base = self._map_source_fields(record, source)
            features = engineered_features(extract_features(base))
            transformed.append(
                {
                    "patient_id": record.get("patient_id") or record.get("subject_id") or record.get("stay_id"),
                    "event_time": self._event_time(record),
                    "source": source,
                    "features": features,
                    "raw": record,
                }
            )
        return transformed

    def prepare_time_series(self, records: list[dict[str, Any]], source: Literal["mimic-iv", "physionet", "generic"] = "generic") -> dict[str, list[dict[str, Any]]]:
        series: dict[str, list[dict[str, Any]]] = {}
        for row in self.transform_records(records, source):
            patient_id = str(row["patient_id"] or "unknown")
            series.setdefault(patient_id, []).append(row)
        for rows in series.values():
            rows.sort(key=lambda item: item["event_time"] or "")
        return series

    @staticmethod
    def _map_source_fields(record: dict[str, Any], source: str) -> dict[str, Any]:
        if source == "mimic-iv":
            return {
                "heart_rate": record.get("heart_rate") or record.get("hr"),
                "blood_pressure": record.get("sbp") or record.get("systolic_bp"),
                "spo2": record.get("spo2"),
                "respiratory_rate": record.get("resp_rate") or record.get("respiratory_rate"),
                "temperature": record.get("temperature") or record.get("temperature_c"),
                "wbc_count": record.get("wbc"),
                "lactate_level": record.get("lactate"),
            }
        if source == "physionet":
            return {
                "heart_rate": record.get("HR"),
                "blood_pressure": record.get("SBP"),
                "spo2": record.get("O2Sat"),
                "respiratory_rate": record.get("Resp"),
                "temperature": record.get("Temp"),
                "wbc_count": record.get("WBC"),
                "lactate_level": record.get("Lactate"),
            }
        return record

    @staticmethod
    def _event_time(record: dict[str, Any]) -> str | None:
        value = record.get("charttime") or record.get("timestamp") or record.get("event_time")
        if isinstance(value, datetime):
            return value.isoformat()
        return str(value) if value else None
