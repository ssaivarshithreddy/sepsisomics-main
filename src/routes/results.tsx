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
import { AlertTriangle, ShieldCheck, Activity, Download, Trash2, FileX } from "lucide-react";
import { Header } from "@/components/Header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { getPredictions, clearPredictions, type StoredPrediction } from "@/lib/results-store";

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
} as const;

function ResultsPage() {
  const [predictions, setPredictions] = useState<StoredPrediction[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            <p className="mt-2 text-muted-foreground">Upload a dataset to see results here.</p>
            <Link
              to="/upload"
              className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Go to Upload
            </Link>
            {error && <p className="mt-4 text-xs text-destructive">{error}</p>}
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!selected) return null;
  const r = selected.result;
  const importanceData = r.contributions.slice(0, 8).map((c) => ({
    name: c.label.replace(/\(.*\)/, "").trim(),
    value: Number((c.importance * 100).toFixed(1)),
    contribution: c.contribution,
  }));

  const gaugeData = [
    {
      name: "risk",
      value: Number((r.probability * 100).toFixed(1)),
      fill: r.sepsis ? severityColor[r.severity] : "var(--color-success)",
    },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Header />

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Prediction Results
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {predictions.length} patient{predictions.length === 1 ? "" : "s"} analyzed.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={downloadReport}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                <Download className="h-4 w-4" /> Report
              </button>
              <button
                onClick={handleClear}
                className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" /> Clear
              </button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            {/* Patient list */}
            <aside className="rounded-2xl border border-border bg-card p-3">
              <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Patients
              </div>
              <ul className="max-h-[600px] space-y-1 overflow-y-auto">
                {predictions.map((p) => {
                  const active = p.id === selected.id;
                  const sev = p.result.severity;
                  return (
                    <li key={p.id}>
                      <button
                        onClick={() => setSelectedId(p.id)}
                        className={`w-full rounded-xl px-3 py-2.5 text-left transition-colors ${active ? "bg-primary/10" : "hover:bg-muted"}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">{p.patientId}</span>
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                            style={{
                              backgroundColor: p.result.sepsis
                                ? severityColor[sev]
                                : "var(--color-success)",
                            }}
                          >
                            {p.result.sepsis ? sev : "Low"}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {(p.result.probability * 100).toFixed(0)}% risk
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>

            {/* Detail */}
            <main className="space-y-6">
              {/* Headline cards */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {r.sepsis ? (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 text-success" />
                    )}
                    Diagnosis
                  </div>
                  <div className="mt-2 font-display text-3xl font-bold">
                    {r.sepsis ? "Sepsis Risk" : "No Sepsis"}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.sepsis
                      ? "Model predicts patient is septic."
                      : "Model predicts patient is unaffected."}
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Activity className="h-4 w-4 text-primary" /> Severity
                  </div>
                  <div
                    className="mt-2 font-display text-3xl font-bold"
                    style={{ color: r.sepsis ? severityColor[r.severity] : "var(--color-success)" }}
                  >
                    {r.sepsis ? r.severity : "Low"}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Score {(r.severityScore * 100).toFixed(0)} / 100
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Confidence
                  </div>
                  <div className="mt-2 font-display text-3xl font-bold">
                    {(r.probability * 100).toFixed(1)}%
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${r.probability * 100}%`,
                        background: r.sepsis ? severityColor[r.severity] : "var(--color-success)",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                  <h3 className="font-display text-lg font-semibold">Feature Importance</h3>
                  <p className="mb-4 text-xs text-muted-foreground">
                    Relative contribution of each biomarker to the prediction.
                  </p>
                  <div className="h-[340px] w-full">
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
                                d.contribution >= 0 ? "var(--color-primary)" : "var(--color-accent)"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                  <h3 className="font-display text-lg font-semibold">Risk Probability</h3>
                  <div className="relative h-[340px] w-full">
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
                        sepsis risk
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Explainability */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <h3 className="font-display text-lg font-semibold">Why this prediction?</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.summary}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {r.topDrivers.map((d) => (
                    <div
                      key={d.key}
                      className="rounded-xl border border-border bg-background/50 p-4"
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
                          {d.value.toFixed(2)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {d.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
