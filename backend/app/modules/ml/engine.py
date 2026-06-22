from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from app.core.config import settings
from app.modules.ml.features import FEATURE_COLUMNS, engineered_features, extract_features

ENGINEERED_COLUMNS = FEATURE_COLUMNS + ["shock_index", "hypoxia_load", "inflammation_load"]


class ClinicalMLEngine:
    def __init__(self) -> None:
        self.sepsis_classifier: Pipeline
        self.mortality_regressor: Pipeline
        self.deterioration_regressor: Pipeline
        self.model_version = "rf-foundation-v1"
        self._load_or_bootstrap()

    def predict(self, record: dict[str, Any]) -> dict[str, Any]:
        features = engineered_features(extract_features(record))
        vector = np.array([[features[column] for column in ENGINEERED_COLUMNS]])
        sepsis_probability = float(self.sepsis_classifier.predict_proba(vector)[0][1])
        mortality_risk = float(np.clip(self.mortality_regressor.predict(vector)[0], 0, 1))
        deterioration_risk = float(np.clip(self.deterioration_regressor.predict(vector)[0], 0, 1))
        return {
            "sepsis_probability": sepsis_probability,
            "mortality_risk": mortality_risk,
            "deterioration_risk": deterioration_risk,
            "features": features,
            "model_version": self.model_version,
        }

    def _load_or_bootstrap(self) -> None:
        if settings.ml_model_path and Path(settings.ml_model_path).exists():
            artifact = joblib.load(settings.ml_model_path)
            self.sepsis_classifier = artifact["sepsis_classifier"]
            self.mortality_regressor = artifact["mortality_regressor"]
            self.deterioration_regressor = artifact["deterioration_regressor"]
            self.model_version = artifact.get("model_version", self.model_version)
            return

        x, y_sepsis, y_mortality, y_deterioration = self._synthetic_training_frame()
        self.sepsis_classifier = Pipeline(
            [
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler()),
                ("model", RandomForestClassifier(n_estimators=120, max_depth=6, random_state=42, class_weight="balanced")),
            ]
        )
        self.mortality_regressor = Pipeline(
            [
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler()),
                ("model", RandomForestRegressor(n_estimators=100, max_depth=6, random_state=43)),
            ]
        )
        self.deterioration_regressor = Pipeline(
            [
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler()),
                ("model", RandomForestRegressor(n_estimators=100, max_depth=6, random_state=44)),
            ]
        )
        self.sepsis_classifier.fit(x, y_sepsis)
        self.mortality_regressor.fit(x, y_mortality)
        self.deterioration_regressor.fit(x, y_deterioration)

    @staticmethod
    def _synthetic_training_frame() -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        rng = np.random.default_rng(42)
        rows: list[list[float]] = []
        sepsis: list[int] = []
        mortality: list[float] = []
        deterioration: list[float] = []
        for _ in range(2500):
            record = {
                "heart_rate": rng.normal(88, 24),
                "blood_pressure": rng.normal(112, 24),
                "spo2": rng.normal(96, 5),
                "respiratory_rate": rng.normal(19, 6),
                "temperature": rng.normal(37.2, 1.1),
                "wbc_count": rng.normal(9, 5),
                "lactate_level": max(0.2, rng.gamma(2.0, 1.0)),
            }
            features = engineered_features(record)
            acuity = (
                max(0, features["heart_rate"] - 105) / 35
                + max(0, 92 - features["spo2"]) / 8
                + max(0, features["respiratory_rate"] - 22) / 10
                + max(0, features["temperature"] - 38.0)
                + max(0, features["lactate_level"] - 2) / 2
                + max(0, 95 - features["blood_pressure"]) / 20
                + max(0, features["wbc_count"] - 12) / 12
            )
            probability = 1 / (1 + np.exp(-(acuity - 2.2)))
            rows.append([features[column] for column in ENGINEERED_COLUMNS])
            sepsis.append(int(probability > 0.45))
            mortality.append(float(np.clip(probability * 0.55 + max(0, 85 - features["blood_pressure"]) / 100, 0, 1)))
            deterioration.append(float(np.clip(probability * 0.75 + features["shock_index"] * 0.12, 0, 1)))
        return np.array(rows), np.array(sepsis), np.array(mortality), np.array(deterioration)


@lru_cache
def get_ml_engine() -> ClinicalMLEngine:
    return ClinicalMLEngine()
