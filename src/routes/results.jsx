import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import {
  AlertTriangle,
  ShieldCheck,
  Activity,
  Download,
  Trash2,
  FileX,
  Printer,
  Sparkles,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Stethoscope,
  CheckSquare,
  Square,
  HeartPulse,
} from "lucide-react";
import { Header } from "@/components/Header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getPredictions, clearPredictions, savePredictions } from "@/lib/results-store";
import { PHYSIONET_SEPSIS_COHORT } from "@/lib/benchmark-data";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Prediction Results — SepsiOmics" },
      { name: "description", content: "Per-patient sepsis risk, severity, and biomarker drivers." },
    ],
  }),
  component: ResultsPage,
});

const severityColor = {
  Low: "var(--color-success)",
  Moderate: "var(--color-warning)",
  Severe: "var(--color-destructive)",
};

function ResultsPage() {
  const [predictions, setPredictions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checklist, setChecklist] = useState({
    lactate: false,
    cultures: false,
    antibiotics: false,
    fluids: false,
    vasopressors: false,
  });

  const toggleCheck = (key) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    getPredictions()
      .then((all) => {
        setPredictions(all);
        setSelectedId(all[0]?.id ?? null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load predictions."))
      .finally(() => setLoading(false));
  }, []);

  const selected = useMemo(
    () => predictions.find((p) => p.id === selectedId) ?? predictions[0],
    [predictions, selectedId],
  );

  const handleClear = async () => {
    await clearPredictions();
    setPredictions([]);
    setSelectedId(null);
  };

  const handleLoadBenchmark = async () => {
    setLoading(true);
    try {
      const saved = await savePredictions(PHYSIONET_SEPSIS_COHORT);
      setPredictions(saved);
      setSelectedId(saved[0]?.id ?? null);
    } catch {
      setError("Failed to load benchmark cohort.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = async (targetId) => {
    let list = predictions;
    if (!list || list.length === 0) {
      setLoading(true);
      try {
        list = await savePredictions(PHYSIONET_SEPSIS_COHORT);
        setPredictions(list);
      } catch {
        setError("Failed to load demo cohort.");
        setLoading(false);
        return;
      }
      setLoading(false);
    }
    const match = list.find((p) => p.patientId === targetId) || list[0];
    if (match) setSelectedId(match.id);
  };

  const printReport = () => {
    if (!selected) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const r = selected.result;
    const isRed = r.sepsis && (r.severity === "Severe" || r.probability >= 0.7);
    const isYellow =
      (r.sepsis && r.severity === "Moderate") || (r.probability >= 0.45 && r.probability < 0.7);
    const badgeColor = isRed ? "#dc2626" : isYellow ? "#d97706" : "#16a34a";
    const badgeBg = isRed ? "#fee2e2" : isYellow ? "#fef3c7" : "#dcfce7";
    const badgeTitle = isRed
      ? "RED ALERT: IMMEDIATE 1-HOUR PROTOCOL"
      : isYellow
        ? "YELLOW WARNING: CAUTION & MONITORING"
        : "GREEN: STABLE & LOW RISK";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>SepsiOmics Bedside Clinical Card - ${selected.patientId}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 32px; color: #0f172a; max-width: 800px; margin: 0 auto; line-height: 1.5; }
            .header { border-bottom: 3px solid #0284c7; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            .brand { font-size: 22px; font-weight: 800; color: #0284c7; }
            .inst { font-size: 12px; color: #64748b; font-weight: 500; }
            .traffic-card { border: 2px solid ${badgeColor}; background: ${badgeBg}; border-radius: 14px; padding: 18px; margin: 18px 0; }
            .traffic-title { font-size: 18px; font-weight: 800; color: ${badgeColor}; margin-bottom: 6px; }
            .traffic-desc { font-size: 13px; color: #334155; }
            .checklist { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-top: 16px; }
            .checklist-title { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 10px; }
            .item { font-size: 12px; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
            th { background: #f1f5f9; font-weight: 600; }
            .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 11px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">SepsiOmics · Clinical Decision Support</div>
              <div class="inst">Department of Bioinformatics · Saveetha University</div>
            </div>
            <div style="text-align: right; font-size: 12px; color: #64748b;">
              <strong>Patient: ${selected.patientId}</strong><br/>
              Date: ${new Date(selected.createdAt).toLocaleDateString()}
            </div>
          </div>

          <div class="traffic-card">
            <div class="traffic-title">${badgeTitle} (${(r.probability * 100).toFixed(0)}% Probability)</div>
            <div class="traffic-desc">${r.summary}</div>
          </div>

          <div class="checklist">
            <div class="checklist-title">Surviving Sepsis 1-Hour Care Bundle:</div>
            <div class="item"><span>[  ]</span> 1. Measure blood lactate level to assess tissue hypoperfusion</div>
            <div class="item"><span>[  ]</span> 2. Obtain 2 blood culture sets prior to antimicrobial therapy</div>
            <div class="item"><span>[  ]</span> 3. Administer broad-spectrum IV antibiotics within 60 mins</div>
            <div class="item"><span>[  ]</span> 4. Rapid administration of 30 mL/kg crystalloid fluid for hypotension</div>
            <div class="item"><span>[  ]</span> 5. Apply vasopressors (Norepinephrine) if MAP &lt; 65 mmHg persists</div>
          </div>

          <h3 style="margin-top: 20px; margin-bottom: 6px; font-size: 13px;">Top Contributing Multi-Omics Biomarkers:</h3>
          <table>
            <thead>
              <tr>
                <th>Biomarker</th>
                <th>Category</th>
                <th>Value</th>
                <th>Status</th>
                <th>Model Contribution</th>
              </tr>
            </thead>
            <tbody>
              ${r.contributions.slice(0, 6).map((c) => `
                <tr>
                  <td><strong>${c.label}</strong></td>
                  <td>${c.category}</td>
                  <td>${c.value.toFixed(2)}</td>
                  <td><strong style="color: ${c.status === "abnormal-high" ? "#dc2626" : c.status === "abnormal-low" ? "#d97706" : "#16a34a"}">${c.status}</strong></td>
                  <td>${c.contribution.toFixed(2)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div class="footer">
            <strong>Clinical Safety Disclaimer:</strong> SepsiOmics is an algorithmic decision-support tool designed for medical education, research, and physician triage guidance.
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const downloadReport = () => {
    if (!selected) return;
    const r = selected.result;
    const lines = [
      "SepsiOmics Prediction Report",
      "=".repeat(40),
      `Patient: ${selected.patientId}`,
      `Generated: ${new Date(selected.createdAt).toLocaleString()}`,
      "",
      `Sepsis prediction: ${r.sepsis ? "POSITIVE" : "NEGATIVE"}`,
      `Confidence: ${(r.probability * 100).toFixed(1)}%`,
      `Severity: ${r.severity} (score ${(r.severityScore * 100).toFixed(0)})`,
      "",
      "Top contributing biomarkers:",
      ...r.topDrivers.map(
        (d, i) =>
          `  ${i + 1}. ${d.label} = ${d.value.toFixed(2)}  [${d.status}]  contribution=${d.contribution.toFixed(2)}`,
      ),
      "",
      "Summary:",
      r.summary,
      "",
      "Disclaimer: Clinical decision support foundation, not for clinical use.",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sepsiomics-${selected.patientId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen">
          <Header />
          <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Activity className="h-7 w-7" />
            </span>
            <h1 className="mt-5 font-display text-3xl font-bold">Loading predictions</h1>
            <p className="mt-2 text-muted-foreground">
              Fetching the latest clinical analysis results.
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (predictions.length === 0) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen">
          <Header />
          <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <FileX className="h-7 w-7" />
            </span>
            <h1 className="mt-5 font-display text-3xl font-bold">No predictions yet</h1>
            <p className="mt-2 text-muted-foreground">
              Upload a multi-omics dataset or load the PhysioNet 2019 validation cohort.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={handleLoadBenchmark}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90"
              >
                <Sparkles className="h-4 w-4" /> Load PhysioNet 2019 Cohort (10 Patients)
              </button>
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Go to Upload
              </Link>
            </div>
            {error && <p className="mt-4 text-xs text-destructive">{error}</p>}
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!selected) return null;
  const r = selected.result;

  const isRed = r.sepsis && (r.severity === "Severe" || r.probability >= 0.7);
  const isYellow =
    (r.sepsis && r.severity === "Moderate") || (r.probability >= 0.45 && r.probability < 0.7);
  const isGreen = !isRed && !isYellow;

  const importanceData = r.contributions.slice(0, 8).map((c) => ({
    name: c.label.replace(/\(.*\)/, "").trim(),
    value: Number((c.importance * 100).toFixed(1)),
    contribution: c.contribution,
  }));

  const gaugeData = [
    {
      name: "risk",
      value: Number((r.probability * 100).toFixed(1)),
      fill: isRed
        ? "var(--color-destructive)"
        : isYellow
          ? "var(--color-warning)"
          : "var(--color-success)",
    },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Header />

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {/* Header Title & Actions */}
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <HeartPulse className="h-3.5 w-3.5" />
                Clinical Decision Support System
              </span>
              <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Patient Sepsis Triage
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Analyzing {predictions.length} patient records with 14 multi-omics biomarkers.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={printReport}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
              >
                <Printer className="h-4 w-4" /> Print Bedside Card
              </button>
              <button
                onClick={downloadReport}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-medium hover:bg-muted"
              >
                <Download className="h-4 w-4" /> Text Report
              </button>
              <button
                onClick={handleClear}
                className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" /> Clear
              </button>
            </div>
          </div>

          {/* Quick Scenario Toggles for Evaluators & Testers */}
          <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
              <div>
                <div className="text-xs font-bold text-foreground">
                  Evaluator 1-Click Traffic Light Demo:
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Click any button to test Green, Yellow, or Red scenarios instantly:
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleSelectDemo("PHYS-ICU-001")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-600 transition-all hover:bg-emerald-500/20 dark:text-emerald-400"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                🟢 Stable (Bed 01)
              </button>
              <button
                type="button"
                onClick={() => handleSelectDemo("PHYS-ICU-003")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-600 transition-all hover:bg-amber-500/20 dark:text-amber-400"
              >
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                🟡 Warning (Bed 03)
              </button>
              <button
                type="button"
                onClick={() => handleSelectDemo("PHYS-ICU-005")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-2 text-xs font-bold text-red-600 transition-all hover:bg-red-500/20 dark:text-red-400"
              >
                <span className="h-2 w-2 rounded-full bg-red-500" />
                🔴 Critical Shock (Bed 05)
              </button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            {/* Patient list sidebar */}
            <aside className="rounded-2xl border border-border bg-card p-3 shadow-sm">
              <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Patient Roster ({predictions.length})
              </div>
              <ul className="max-h-[640px] space-y-1.5 overflow-y-auto">
                {predictions.map((p) => {
                  const active = p.id === selected.id;
                  const pIsRed =
                    p.result.sepsis &&
                    (p.result.severity === "Severe" || p.result.probability >= 0.7);
                  const pIsYellow =
                    (p.result.sepsis && p.result.severity === "Moderate") ||
                    (p.result.probability >= 0.45 && p.result.probability < 0.7);

                  return (
                    <li key={p.id}>
                      <button
                        onClick={() => setSelectedId(p.id)}
                        className={`w-full rounded-xl px-3 py-2.5 text-left transition-all ${
                          active
                            ? "bg-primary/10 border border-primary/30"
                            : "hover:bg-muted border border-transparent"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">{p.patientId}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              pIsRed
                                ? "bg-red-500 text-white"
                                : pIsYellow
                                  ? "bg-amber-500 text-white"
                                  : "bg-emerald-600 text-white"
                            }`}
                          >
                            {pIsRed ? "Red" : pIsYellow ? "Yellow" : "Green"}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{(p.result.probability * 100).toFixed(0)}% Sepsis Risk</span>
                          <span>{p.result.severity}</span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>

            {/* Main Detail Content */}
            <main className="space-y-6">
              {/* Traffic Light Bedside Action Card */}
              <div
                className={`overflow-hidden rounded-3xl border-2 p-6 shadow-sm transition-all ${
                  isRed
                    ? "border-red-500/50 bg-gradient-to-br from-red-500/10 via-card to-card"
                    : isYellow
                      ? "border-amber-500/50 bg-gradient-to-br from-amber-500/10 via-card to-card"
                      : "border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 via-card to-card"
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm ${
                        isRed
                          ? "bg-red-500 text-white animate-pulse"
                          : isYellow
                            ? "bg-amber-500 text-white"
                            : "bg-emerald-600 text-white"
                      }`}
                    >
                      {isRed ? (
                        <AlertOctagon className="h-8 w-8" />
                      ) : isYellow ? (
                        <AlertTriangle className="h-8 w-8" />
                      ) : (
                        <ShieldCheck className="h-8 w-8" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                            isRed
                              ? "bg-red-500/20 text-red-600 dark:text-red-400"
                              : isYellow
                                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                                : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {isRed
                            ? "🔴 RED ALERT · CRITICAL RISK"
                            : isYellow
                              ? "🟡 YELLOW WARNING · CAUTION"
                              : "🟢 GREEN · STABLE CONDITION"}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          Patient: {selected.patientId}
                        </span>
                      </div>
                      <h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight">
                        {isRed
                          ? "Immediate 1-Hour Sepsis Resuscitation Required"
                          : isYellow
                            ? "Early Systemic Inflammation Detected"
                            : "Patient Hemodynamically Stable — Low Sepsis Risk"}
                      </h2>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        {isRed
                          ? "Acute organ dysfunction or severe tissue hypoperfusion detected. Immediate Surviving Sepsis Bundle activation is indicated."
                          : isYellow
                            ? "Early physiological drift and cytokine elevation detected. Close bedside monitoring and repeat labs advised within 60 minutes."
                            : "Patient vitals and multi-omics markers remain within normal parameters. Continue routine ward observation."}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-border bg-card p-3 px-5 text-right shadow-sm">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Sepsis Probability
                      </div>
                      <div
                        className={`font-mono text-3xl font-extrabold ${
                          isRed
                            ? "text-red-500"
                            : isYellow
                              ? "text-amber-500"
                              : "text-emerald-600"
                        }`}
                      >
                        {(r.probability * 100).toFixed(0)}%
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Acuity: <strong>{r.severity}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 1-Hour Care Bundle Checklist */}
                <div className="mt-6 border-t border-border/60 pt-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                      <Stethoscope className="h-4 w-4 text-primary" />
                      1-Hour Bedside Action Checklist (Surviving Sepsis Campaign):
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      Interactive Protocol
                    </span>
                  </div>

                  <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      {
                        key: "lactate",
                        step: "1. Measure Blood Lactate",
                        desc: "Check tissue hypoperfusion (Re-measure if > 2.0 mmol/L)",
                      },
                      {
                        key: "cultures",
                        step: "2. Draw Blood Cultures",
                        desc: "2 sets prior to antibiotic administration",
                      },
                      {
                        key: "antibiotics",
                        step: "3. Broad-Spectrum IV Antibiotics",
                        desc: "Administer targeted antimicrobials within 60 mins",
                      },
                      {
                        key: "fluids",
                        step: "4. Rapid IV Crystalloids",
                        desc: "30 mL/kg fluid bolus for MAP < 65 or lactate >= 4",
                      },
                      {
                        key: "vasopressors",
                        step: "5. Vasopressors (Norepinephrine)",
                        desc: "Maintain MAP >= 65 mmHg if fluids fail",
                      },
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.key}
                        onClick={() => toggleCheck(item.key)}
                        className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all ${
                          checklist[item.key]
                            ? "border-primary/40 bg-primary/10 opacity-60 line-through"
                            : "border-border bg-card/70 hover:border-primary/30"
                        }`}
                      >
                        {checklist[item.key] ? (
                          <CheckSquare className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                        ) : (
                          <Square className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                        )}
                        <div>
                          <div className="text-xs font-semibold text-foreground">{item.step}</div>
                          <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                            {item.desc}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Headline Summary Cards */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {r.sepsis ? (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 text-success" />
                    )}
                    Diagnostic Status
                  </div>
                  <div className="mt-2 font-display text-3xl font-bold">
                    {r.sepsis ? "Sepsis Risk" : "No Sepsis"}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.sepsis
                      ? "Physiological markers indicate infection response."
                      : "Patient parameters remain unaffected."}
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Activity className="h-4 w-4 text-primary" /> Severity Tier
                  </div>
                  <div
                    className="mt-2 font-display text-3xl font-bold"
                    style={{
                      color: isRed
                        ? "var(--color-destructive)"
                        : isYellow
                          ? "var(--color-warning)"
                          : "var(--color-success)",
                    }}
                  >
                    {r.severity}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Acuity score {(r.severityScore * 100).toFixed(0)} / 100
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Confidence Level
                  </div>
                  <div className="mt-2 font-display text-3xl font-bold">
                    {(r.probability * 100).toFixed(1)}%
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${r.probability * 100}%`,
                        background: isRed
                          ? "var(--color-destructive)"
                          : isYellow
                            ? "var(--color-warning)"
                            : "var(--color-success)",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Explainability Breakdown */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-lg font-semibold">
                      Why Did the AI Make This Decision?
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Primary multi-omics biomarkers and vital signs driving this risk assessment.
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    Explainable AI (XAI)
                  </span>
                </div>

                <div className="mt-4 rounded-xl border border-border/80 bg-muted/40 p-4 text-sm text-foreground">
                  <strong>Clinical Summary:</strong> {r.summary}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {r.topDrivers.map((d) => (
                    <div
                      key={d.key}
                      className="rounded-xl border border-border bg-background/60 p-4 transition-all hover:bg-muted/30"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold">{d.label}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">{d.category}</div>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            d.status === "normal"
                              ? "bg-success/10 text-success"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {d.value.toFixed(2)} [{d.status}]
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {d.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Charts */}
              <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="font-display text-lg font-semibold">Feature Importance Weights</h3>
                  <p className="mb-4 text-xs text-muted-foreground">
                    Relative mathematical contribution of each biomarker to the final score.
                  </p>
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer>
                      <BarChart
                        data={importanceData}
                        layout="vertical"
                        margin={{ left: 20, right: 24 }}
                      >
                        <XAxis type="number" hide domain={[0, 100]} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={140}
                          tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: "var(--color-muted)" }}
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid var(--color-border)",
                            background: "var(--color-card)",
                            fontSize: 12,
                          }}
                          formatter={(v) => [`${v}%`, "Importance"]}
                        />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                          {importanceData.map((d, i) => (
                            <Cell
                              key={i}
                              fill={
                                d.contribution >= 0
                                  ? "var(--color-primary)"
                                  : "var(--color-accent)"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="font-display text-lg font-semibold">Sepsis Probability</h3>
                  <div className="relative h-[320px] w-full">
                    <ResponsiveContainer>
                      <RadialBarChart
                        innerRadius="70%"
                        outerRadius="100%"
                        data={gaugeData}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                        <RadialBar
                          background={{ fill: "var(--color-muted)" }}
                          dataKey="value"
                          cornerRadius={10}
                        />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-display text-5xl font-bold">
                        {(r.probability * 100).toFixed(0)}%
                      </span>
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">
                        sepsis probability
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
