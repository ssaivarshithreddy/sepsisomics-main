from math import exp
from typing import Any, Literal

BIOMARKERS = [
    {"key": "lactate", "label": "Lactate (mmol/L)", "category": "Clinical", "weight": 1.6, "normal_range": (0.5, 2.0), "description": "Elevated lactate signals tissue hypoperfusion."},
    {"key": "crp", "label": "C-Reactive Protein", "category": "Proteomics", "weight": 1.2, "normal_range": (0, 10), "description": "Acute-phase reactant; rises sharply in infection."},
    {"key": "procalcitonin", "label": "Procalcitonin", "category": "Proteomics", "weight": 1.8, "normal_range": (0, 0.5), "description": "Highly specific biomarker for bacterial sepsis."},
    {"key": "il6", "label": "Interleukin-6", "category": "Proteomics", "weight": 1.4, "normal_range": (0, 7), "description": "Pro-inflammatory cytokine; early sepsis indicator."},
    {"key": "wbc", "label": "WBC Count (10^9/L)", "category": "Clinical", "weight": 0.9, "normal_range": (4, 11), "description": "Leukocytosis or leukopenia suggests systemic infection."},
    {"key": "heart_rate", "label": "Heart Rate (bpm)", "category": "Clinical", "weight": 0.7, "normal_range": (60, 100), "description": "Tachycardia is a SIRS/qSOFA criterion."},
    {"key": "resp_rate", "label": "Respiratory Rate", "category": "Clinical", "weight": 0.8, "normal_range": (12, 20), "description": "Tachypnea is a qSOFA criterion."},
    {"key": "temperature", "label": "Temperature (C)", "category": "Clinical", "weight": 0.6, "normal_range": (36.1, 37.8), "description": "Fever or hypothermia indicates systemic response."},
    {"key": "sbp", "label": "Systolic BP (mmHg)", "category": "Clinical", "weight": 0.9, "normal_range": (100, 140), "description": "Hypotension defines septic shock."},
    {"key": "tnf_alpha", "label": "TNF-alpha", "category": "Proteomics", "weight": 1.1, "normal_range": (0, 8.1), "description": "Master cytokine driving the sepsis cascade."},
    {"key": "hla_dr", "label": "HLA-DR Expression", "category": "Genomics", "weight": -1.0, "normal_range": (60, 100), "description": "Low HLA-DR signals immune suppression in late sepsis."},
    {"key": "tlr4_expr", "label": "TLR4 Gene Expression", "category": "Genomics", "weight": 1.0, "normal_range": (0.8, 1.2), "description": "Pattern recognition receptor for bacterial endotoxin."},
    {"key": "lactic_acid_met", "label": "Lactic Acid (metab.)", "category": "Metabolomics", "weight": 1.3, "normal_range": (0.5, 2.2), "description": "Metabolomic confirmation of anaerobic metabolism."},
    {"key": "kynurenine", "label": "Kynurenine", "category": "Metabolomics", "weight": 1.1, "normal_range": (1.0, 3.0), "description": "Tryptophan metabolite elevated in sepsis."},
]


def _num(value: Any) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _sigmoid(value: float) -> float:
    return 1 / (1 + exp(-value))


def score_record(record: dict[str, Any]) -> dict[str, Any]:
    contributions: list[dict[str, Any]] = []
    logit = -2.2
    for biomarker in BIOMARKERS:
        raw = _num(record.get(biomarker["key"]))
        if raw is None:
            continue
        low, high = biomarker["normal_range"]
        midpoint = (low + high) / 2
        span = max((high - low) / 2, 0.01)
        z_score = (raw - midpoint) / span
        contribution = float(biomarker["weight"]) * max(-4, min(4, z_score)) * 0.55
        logit += contribution
        status: Literal["normal", "abnormal-high", "abnormal-low"] = "normal"
        if raw > high:
            status = "abnormal-high"
        elif raw < low:
            status = "abnormal-low"
        contributions.append(
            {
                "key": biomarker["key"],
                "label": biomarker["label"],
                "category": biomarker["category"],
                "value": raw,
                "zScore": z_score,
                "contribution": contribution,
                "importance": 0,
                "description": biomarker["description"],
                "status": status,
            }
        )

    max_abs = max([abs(c["contribution"]) for c in contributions] or [0.0001])
    for contribution in contributions:
        contribution["importance"] = abs(contribution["contribution"]) / max_abs
    contributions.sort(key=lambda c: c["importance"], reverse=True)

    probability = _sigmoid(logit)
    sepsis = probability >= 0.5
    abnormal_count = len([c for c in contributions if c["status"] != "normal"])
    severity_score = min(1, probability * 0.7 + (abnormal_count / len(BIOMARKERS)) * 0.6)
    severity = "Low"
    if severity_score >= 0.75:
        severity = "Severe"
    elif severity_score >= 0.5:
        severity = "Moderate"
    top_drivers = contributions[:5]
    driver_text = ", ".join([f"{d['label']} ({d['value']:.2f})" for d in top_drivers[:3]])
    summary = (
        f"Model indicates {severity.lower()} sepsis risk ({probability * 100:.1f}% confidence). Primary contributors: {driver_text}."
        if sepsis
        else f"Model indicates low sepsis risk ({(1 - probability) * 100:.1f}% confidence the patient is unaffected). Markers reviewed: {driver_text}."
    )
    return {
        "sepsis": sepsis,
        "probability": probability,
        "severity": severity,
        "severityScore": severity_score,
        "contributions": contributions,
        "topDrivers": top_drivers,
        "summary": summary,
    }
