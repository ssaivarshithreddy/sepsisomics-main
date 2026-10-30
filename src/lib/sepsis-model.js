// Shared biomarker metadata and prediction result contracts used by the API-connected UI.
export const BIOMARKERS = [
  {
    key: "lactate",
    label: "Lactate (mmol/L)",
    category: "Clinical",
    weight: 1.6,
    normalRange: [0.5, 2.0],
    description: "Elevated lactate signals tissue hypoperfusion.",
  },
  {
    key: "crp",
    label: "C-Reactive Protein",
    category: "Proteomics",
    weight: 1.2,
    normalRange: [0, 10],
    description: "Acute-phase reactant; rises sharply in infection.",
  },
  {
    key: "procalcitonin",
    label: "Procalcitonin",
    category: "Proteomics",
    weight: 1.8,
    normalRange: [0, 0.5],
    description: "Highly specific biomarker for bacterial sepsis.",
  },
  {
    key: "il6",
    label: "Interleukin-6",
    category: "Proteomics",
    weight: 1.4,
    normalRange: [0, 7],
    description: "Pro-inflammatory cytokine; early sepsis indicator.",
  },
  {
    key: "wbc",
    label: "WBC Count (10⁹/L)",
    category: "Clinical",
    weight: 0.9,
    normalRange: [4, 11],
    description: "Leukocytosis or leukopenia suggests systemic infection.",
  },
  {
    key: "heart_rate",
    label: "Heart Rate (bpm)",
    category: "Clinical",
    weight: 0.7,
    normalRange: [60, 100],
    description: "Tachycardia is a SIRS/qSOFA criterion.",
  },
  {
    key: "resp_rate",
    label: "Respiratory Rate",
    category: "Clinical",
    weight: 0.8,
    normalRange: [12, 20],
    description: "Tachypnea is a qSOFA criterion.",
  },
  {
    key: "temperature",
    label: "Temperature (°C)",
    category: "Clinical",
    weight: 0.6,
    normalRange: [36.1, 37.8],
    description: "Fever or hypothermia indicates systemic response.",
  },
  {
    key: "sbp",
    label: "Systolic BP (mmHg)",
    category: "Clinical",
    weight: 0.9,
    normalRange: [100, 140],
    description: "Hypotension defines septic shock.",
  },
  {
    key: "tnf_alpha",
    label: "TNF-α",
    category: "Proteomics",
    weight: 1.1,
    normalRange: [0, 8.1],
    description: "Master cytokine driving the sepsis cascade.",
  },
  {
    key: "hla_dr",
    label: "HLA-DR Expression",
    category: "Genomics",
    weight: -1.0,
    normalRange: [60, 100],
    description: "Low HLA-DR signals immune suppression in late sepsis.",
  },
  {
    key: "tlr4_expr",
    label: "TLR4 Gene Expression",
    category: "Genomics",
    weight: 1.0,
    normalRange: [0.8, 1.2],
    description: "Pattern recognition receptor for bacterial endotoxin.",
  },
  {
    key: "lactic_acid_met",
    label: "Lactic Acid (metab.)",
    category: "Metabolomics",
    weight: 1.3,
    normalRange: [0.5, 2.2],
    description: "Metabolomic confirmation of anaerobic metabolism.",
  },
  {
    key: "kynurenine",
    label: "Kynurenine",
    category: "Metabolomics",
    weight: 1.1,
    normalRange: [1.0, 3.0],
    description: "Tryptophan metabolite elevated in sepsis.",
  },
];

function parseNumeric(val) {
  if (val === null || val === undefined || val === "") return null;
  const num = Number(val);
  return Number.isFinite(num) ? num : null;
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

export function scoreRecord(record) {
  const contributions = [];
  let logit = -2.2;

  for (const biomarker of BIOMARKERS) {
    const raw = parseNumeric(record[biomarker.key]);
    if (raw === null) continue;

    const [low, high] = biomarker.normalRange;
    const midpoint = (low + high) / 2;
    const span = Math.max((high - low) / 2, 0.01);
    const zScore = (raw - midpoint) / span;
    const boundedZ = Math.max(-4, Math.min(4, zScore));
    const contribution = biomarker.weight * boundedZ * 0.55;
    logit += contribution;

    let status = "normal";
    if (raw > high) status = "abnormal-high";
    else if (raw < low) status = "abnormal-low";

    contributions.push({
      key: biomarker.key,
      label: biomarker.label,
      category: biomarker.category,
      value: raw,
      zScore,
      contribution,
      importance: 0,
      description: biomarker.description,
      status,
    });
  }

  const maxAbs = Math.max(...contributions.map((c) => Math.abs(c.contribution)), 0.0001);
  for (const c of contributions) {
    c.importance = Math.abs(c.contribution) / maxAbs;
  }
  contributions.sort((a, b) => b.importance - a.importance);

  const probability = sigmoid(logit);
  const sepsis = probability >= 0.5;
  const abnormalCount = contributions.filter((c) => c.status !== "normal").length;
  const severityScore = Math.min(1, probability * 0.7 + (abnormalCount / BIOMARKERS.length) * 0.6);

  let severity = "Low";
  if (severityScore >= 0.75) severity = "Severe";
  else if (severityScore >= 0.5) severity = "Moderate";

  const topDrivers = contributions.slice(0, 5);
  const driverText = topDrivers
    .slice(0, 3)
    .map((d) => `${d.label} (${d.value.toFixed(2)})`)
    .join(", ");

  const summary = sepsis
    ? `Model indicates ${severity.toLowerCase()} sepsis risk (${(probability * 100).toFixed(1)}% confidence). Primary contributors: ${driverText}.`
    : `Model indicates low sepsis risk (${((1 - probability) * 100).toFixed(1)}% confidence the patient is unaffected). Markers reviewed: ${driverText}.`;

  return {
    sepsis,
    probability,
    severity,
    severityScore,
    contributions,
    topDrivers,
    summary,
  };
}
