from typing import Any

FEATURE_COLUMNS = [
    "heart_rate",
    "blood_pressure",
    "spo2",
    "respiratory_rate",
    "temperature",
    "wbc_count",
    "lactate_level",
]

ALIASES = {
    "blood_pressure": ["blood_pressure", "sbp", "systolic_bp"],
    "spo2": ["spo2", "oxygen_saturation", "oxygen"],
    "respiratory_rate": ["respiratory_rate", "resp_rate"],
    "temperature": ["temperature", "temperature_c", "temp"],
    "wbc_count": ["wbc_count", "wbc"],
    "lactate_level": ["lactate_level", "lactate"],
}

DEFAULTS = {
    "heart_rate": 85.0,
    "blood_pressure": 115.0,
    "spo2": 97.0,
    "respiratory_rate": 18.0,
    "temperature": 37.0,
    "wbc_count": 8.0,
    "lactate_level": 1.4,
}


def numeric(value: Any) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def extract_features(record: dict[str, Any]) -> dict[str, float]:
    features: dict[str, float] = {}
    for column in FEATURE_COLUMNS:
        keys = ALIASES.get(column, [column])
        value = next((numeric(record.get(key)) for key in keys if numeric(record.get(key)) is not None), None)
        features[column] = value if value is not None else DEFAULTS[column]
    return features


def engineered_features(features: dict[str, float]) -> dict[str, float]:
    shock_index = features["heart_rate"] / max(features["blood_pressure"], 1)
    hypoxia_load = max(0.0, 94 - features["spo2"]) / 10
    inflammation_load = max(0.0, features["wbc_count"] - 11) / 10 + max(0.0, features["lactate_level"] - 2)
    return {
        **features,
        "shock_index": shock_index,
        "hypoxia_load": hypoxia_load,
        "inflammation_load": inflammation_load,
    }
