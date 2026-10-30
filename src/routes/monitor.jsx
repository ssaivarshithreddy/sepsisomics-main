import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  Activity,
  Heart,
  Droplets,
  Wind,
  Thermometer,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCircle,
  Stethoscope,
  Info,
} from "lucide-react";
import { Header } from "@/components/Header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { scoreRecord } from "@/lib/sepsis-model";

export const Route = createFileRoute("/monitor")({
  head: () => ({
    meta: [
      { title: "Live ICU Bedside Monitor — SepsiOmics" },
      {
        name: "description",
        content: "Real-time telemetry stream replay and dynamic sepsis risk prediction.",
      },
    ],
  }),
  component: LiveMonitorPage,
});

const PATIENT_PROFILES = [
  {
    id: "BED-01",
    name: "Mr. Ramesh K.",
    age: 48,
    sex: "Male",
    admissionReason: "Post-Op Laparoscopic Cholecystectomy",
    stage: "Stable Recovery",
    initialVitals: {
      heart_rate: 74,
      resp_rate: 15,
      temperature: 36.8,
      sbp: 122,
      dbp: 78,
      spo2: 99,
      lactate: 1.1,
      crp: 4.5,
      procalcitonin: 0.08,
      il6: 4.2,
      wbc: 7.2,
      tnf_alpha: 2.4,
      hla_dr: 88,
      tlr4_expr: 0.95,
      lactic_acid_met: 1.2,
      kynurenine: 1.6,
    },
    deteriorationDelta: {
      heart_rate: 0.2,
      resp_rate: 0.05,
      temperature: 0.01,
      sbp: -0.1,
      lactate: 0.02,
      procalcitonin: 0.005,
      il6: 0.1,
    },
  },
  {
    id: "BED-04",
    name: "Mrs. Lakshmi V.",
    age: 62,
    sex: "Female",
    admissionReason: "Community-Acquired Lobar Pneumonia",
    stage: "Early Sepsis Evolution",
    initialVitals: {
      heart_rate: 106,
      resp_rate: 24,
      temperature: 38.6,
      sbp: 102,
      dbp: 64,
      spo2: 93,
      lactate: 2.6,
      crp: 78.0,
      procalcitonin: 1.8,
      il6: 62.0,
      wbc: 16.8,
      tnf_alpha: 18.0,
      hla_dr: 48,
      tlr4_expr: 1.65,
      lactic_acid_met: 3.0,
      kynurenine: 4.2,
    },
    deteriorationDelta: {
      heart_rate: 1.2,
      resp_rate: 0.4,
      temperature: 0.04,
      sbp: -1.1,
      lactate: 0.15,
      procalcitonin: 0.25,
      il6: 4.5,
    },
  },
  {
    id: "BED-07",
    name: "Mr. Karthik S.",
    age: 71,
    sex: "Male",
    admissionReason: "Urosepsis / Impending Septic Shock",
    stage: "High Acuity / Critical Decompensation",
    initialVitals: {
      heart_rate: 132,
      resp_rate: 31,
      temperature: 39.4,
      sbp: 82,
      dbp: 46,
      spo2: 89,
      lactate: 5.2,
      crp: 160.0,
      procalcitonin: 7.9,
      il6: 175.0,
      wbc: 23.5,
      tnf_alpha: 42.0,
      hla_dr: 24,
      tlr4_expr: 2.55,
      lactic_acid_met: 5.6,
      kynurenine: 7.0,
    },
    deteriorationDelta: {
      heart_rate: 0.8,
      resp_rate: 0.3,
      temperature: 0.02,
      sbp: -0.8,
      lactate: 0.25,
      procalcitonin: 0.4,
      il6: 6.0,
    },
  },
];

function LiveMonitorPage() {
  const [selectedBed, setSelectedBed] = useState("BED-04");
  const [isPlaying, setIsPlaying] = useState(true);
  const [tick, setTick] = useState(0);

  const activeProfile =
    PATIENT_PROFILES.find((p) => p.id === selectedBed) ?? PATIENT_PROFILES[1];

  const [currentVitals, setCurrentVitals] = useState(activeProfile.initialVitals);
  const [checklist, setChecklist] = useState({
    lactateMeasured: false,
    bloodCulturesDrawn: false,
    antibioticsGiven: false,
    fluidsStarted: false,
    vasopressorReady: false,
  });

  // Reset vitals when patient changes
  useEffect(() => {
    setCurrentVitals(activeProfile.initialVitals);
    setTick(0);
    setChecklist({
      lactateMeasured: false,
      bloodCulturesDrawn: false,
      antibioticsGiven: false,
      fluidsStarted: false,
      vasopressorReady: false,
    });
  }, [selectedBed]);

  // Telemetry streaming tick
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setTick((t) => t + 1);
      setCurrentVitals((prev) => {
        const delta = activeProfile.deteriorationDelta;
        // subtle biological noise
        const noise = (Math.random() - 0.5) * 1.5;
        const newHR = Math.max(45, Math.min(170, prev.heart_rate + delta.heart_rate + noise * 0.8));
        const newSBP = Math.max(55, Math.min(180, prev.sbp + delta.sbp + noise * 0.6));
        const newRR = Math.max(10, Math.min(45, prev.resp_rate + delta.resp_rate + noise * 0.2));
        const newLactate = Math.max(0.4, prev.lactate + delta.lactate * 0.3);
        const newPct = Math.max(0.01, prev.procalcitonin + delta.procalcitonin * 0.2);
        const newIl6 = Math.max(1, prev.il6 + delta.il6 * 0.3);

        return {
          ...prev,
          heart_rate: Number(newHR.toFixed(1)),
          sbp: Number(newSBP.toFixed(1)),
          resp_rate: Number(newRR.toFixed(1)),
          lactate: Number(newLactate.toFixed(2)),
          procalcitonin: Number(newPct.toFixed(2)),
          il6: Number(newIl6.toFixed(1)),
        };
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isPlaying, activeProfile]);

  // Compute live AI predictions from dynamic vitals
  const prediction = scoreRecord(currentVitals);

  // Shock index: HR / SBP
  const shockIndex =
    currentVitals.sbp > 0
      ? Number((currentVitals.heart_rate / currentVitals.sbp).toFixed(2))
      : 0;

  // Mean arterial pressure
  const map = Number(
    (currentVitals.dbp + (currentVitals.sbp - currentVitals.dbp) / 3).toFixed(0)
  );

  // Estimated time to decompensation
  const decompMinutes =
    prediction.probability > 0.85
      ? 25
      : prediction.probability > 0.65
        ? 75
        : prediction.probability > 0.4
          ? 240
          : null;

  const handleReset = () => {
    setCurrentVitals(activeProfile.initialVitals);
    setTick(0);
  };

  const handleTriggerAntibioticResponse = () => {
    setCurrentVitals((prev) => ({
      ...prev,
      heart_rate: Math.max(75, prev.heart_rate - 18),
      sbp: Math.min(125, prev.sbp + 20),
      lactate: Math.max(1.4, prev.lactate - 1.5),
      procalcitonin: Math.max(0.3, prev.procalcitonin - 1.2),
      temperature: 37.2,
    }));
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Header />

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header Bar */}
          <div className="flex flex-col gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 relative">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                      prediction.probability > 0.75
                        ? "bg-red-400"
                        : prediction.probability > 0.45
                          ? "bg-amber-400"
                          : "bg-emerald-400"
                    } opacity-75`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-3 w-3 ${
                      prediction.probability > 0.75
                        ? "bg-red-500"
                        : prediction.probability > 0.45
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    }`}
                  />
                </span>
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Telemetry Stream · PhysioNet Sepsis Telemetry Replay
                </span>
                <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-300">
                  Tick #{tick}
                </span>
              </div>
              <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                ICU Clinical Telemetry & Bedside Sepsis Monitor
              </h1>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1">
                {PATIENT_PROFILES.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => setSelectedBed(profile.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedBed === profile.id
                        ? "bg-primary text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {profile.id}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {isPlaying ? "Pause Stream" : "Resume Stream"}
              </button>

              <button
                type="button"
                onClick={handleReset}
                title="Reset to baseline"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
            </div>
          </div>

          {/* Patient Banner */}
          <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:grid-cols-4 lg:grid-cols-6">
            <div>
              <div className="text-[11px] text-slate-400 uppercase">Patient</div>
              <div className="font-semibold text-white">{activeProfile.name}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase">Bed ID</div>
              <div className="font-mono font-semibold text-primary">{activeProfile.id}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase">Age / Sex</div>
              <div className="text-white">{activeProfile.age} yrs · {activeProfile.sex}</div>
            </div>
            <div className="col-span-2">
              <div className="text-[11px] text-slate-400 uppercase">Primary Diagnosis</div>
              <div className="truncate text-white">{activeProfile.admissionReason}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase">Status</div>
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  prediction.probability > 0.75
                    ? "bg-red-500/20 text-red-400"
                    : prediction.probability > 0.45
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-emerald-500/20 text-emerald-400"
                }`}
              >
                {activeProfile.stage}
              </span>
            </div>
          </div>

          {/* Emergency Alert Banner */}
          {prediction.probability >= 0.65 && (
            <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-red-500/40 bg-red-950/40 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-400">
                  <ShieldAlert className="h-6 w-6 animate-pulse" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-red-200">
                    CRITICAL SEPSIS ALERT — Surviving Sepsis 1-Hour Protocol Triggered
                  </h2>
                  <p className="text-xs text-red-300/80">
                    Shock Index: {shockIndex} · Projected decompensation window: ~{decompMinutes} mins.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleTriggerAntibioticResponse}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-red-600"
              >
                <Stethoscope className="h-4 w-4" /> Simulate Treatment & Fluid Resuscitation
              </button>
            </div>
          )}

          {/* Main Monitor Grid */}
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* Vitals Telemetry Columns */}
            <div className="space-y-4 lg:col-span-2">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {/* Heart Rate */}
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4">
                  <div className="flex items-center justify-between text-xs text-emerald-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Heart className="h-4 w-4 animate-pulse text-emerald-400" /> HR (ECG)
                    </span>
                    <span className="font-mono text-[10px]">bpm</span>
                  </div>
                  <div className="mt-3 font-mono text-4xl font-extrabold text-emerald-400">
                    {Math.round(currentVitals.heart_rate)}
                  </div>
                  <div className="mt-2 text-[10px] text-slate-400">
                    Normal: 60–100 bpm · {currentVitals.heart_rate > 100 ? "Tachycardia" : "Normal"}
                  </div>
                </div>

                {/* SpO2 */}
                <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4">
                  <div className="flex items-center justify-between text-xs text-cyan-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Droplets className="h-4 w-4 text-cyan-400" /> SpO₂
                    </span>
                    <span className="font-mono text-[10px]">%</span>
                  </div>
                  <div className="mt-3 font-mono text-4xl font-extrabold text-cyan-400">
                    {Math.round(currentVitals.spo2)}
                  </div>
                  <div className="mt-2 text-[10px] text-slate-400">
                    Target: 95–100% · {currentVitals.spo2 < 92 ? "Hypoxia Alert" : "Adequate"}
                  </div>
                </div>

                {/* Blood Pressure */}
                <div
                  className={`rounded-2xl border p-4 ${
                    currentVitals.sbp < 90
                      ? "border-red-500/40 bg-red-950/20"
                      : "border-yellow-500/30 bg-yellow-950/20"
                  }`}
                >
                  <div
                    className={`flex items-center justify-between text-xs font-medium ${
                      currentVitals.sbp < 90 ? "text-red-400" : "text-yellow-400"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Activity className="h-4 w-4" /> NIBP
                    </span>
                    <span className="font-mono text-[10px]">mmHg</span>
                  </div>
                  <div
                    className={`mt-3 font-mono text-3xl font-extrabold ${
                      currentVitals.sbp < 90 ? "text-red-400" : "text-yellow-400"
                    }`}
                  >
                    {Math.round(currentVitals.sbp)} / {Math.round(currentVitals.dbp)}
                  </div>
                  <div className="mt-2 text-[10px] text-slate-400">
                    MAP: {map} mmHg · {currentVitals.sbp < 90 ? "Hypotension" : "Normotensive"}
                  </div>
                </div>

                {/* Respiratory Rate */}
                <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4">
                  <div className="flex items-center justify-between text-xs text-purple-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Wind className="h-4 w-4 text-purple-400" /> Resp Rate
                    </span>
                    <span className="font-mono text-[10px]">/min</span>
                  </div>
                  <div className="mt-3 font-mono text-4xl font-extrabold text-purple-400">
                    {Math.round(currentVitals.resp_rate)}
                  </div>
                  <div className="mt-2 text-[10px] text-slate-400">
                    Normal: 12–20 · {currentVitals.resp_rate > 22 ? "Tachypneic" : "Normal"}
                  </div>
                </div>

                {/* Temperature */}
                <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4">
                  <div className="flex items-center justify-between text-xs text-amber-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Thermometer className="h-4 w-4 text-amber-400" /> Core Temp
                    </span>
                    <span className="font-mono text-[10px]">°C</span>
                  </div>
                  <div className="mt-3 font-mono text-4xl font-extrabold text-amber-400">
                    {currentVitals.temperature.toFixed(1)}
                  </div>
                  <div className="mt-2 text-[10px] text-slate-400">
                    Normal: 36.1–37.8°C · {currentVitals.temperature > 38.0 ? "Pyrexia" : "Afebrile"}
                  </div>
                </div>

                {/* Shock Index */}
                <div
                  className={`rounded-2xl border p-4 ${
                    shockIndex >= 1.0
                      ? "border-red-500/40 bg-red-950/30 text-red-400"
                      : shockIndex >= 0.8
                        ? "border-amber-500/30 bg-amber-950/20 text-amber-400"
                        : "border-slate-800 bg-slate-900 text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" /> Shock Index
                    </span>
                    <span className="font-mono text-[10px]">HR/SBP</span>
                  </div>
                  <div className="mt-3 font-mono text-4xl font-extrabold">
                    {shockIndex}
                  </div>
                  <div className="mt-2 text-[10px] text-slate-400">
                    Normal: 0.5–0.7 · {shockIndex > 0.9 ? "Critical Shock Risk" : "Stable Hemodynamics"}
                  </div>
                </div>
              </div>

              {/* Multi-Omics Lab Biomarker Telemetry Drawer */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white">
                    Live Multi-Omics Point-of-Care Laboratory Panel
                  </h2>
                  <span className="rounded bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                    14 Biomarkers Active
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-slate-950/80 p-3">
                    <div className="text-[10px] text-slate-400">Procalcitonin (PCT)</div>
                    <div className="mt-1 font-mono text-lg font-bold text-slate-100">
                      {currentVitals.procalcitonin} ng/mL
                    </div>
                    <div className="text-[10px] text-red-400">
                      {currentVitals.procalcitonin > 0.5 ? "↑ Sepsis Range" : "Normal"}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-950/80 p-3">
                    <div className="text-[10px] text-slate-400">Lactate (Hypoperfusion)</div>
                    <div className="mt-1 font-mono text-lg font-bold text-slate-100">
                      {currentVitals.lactate} mmol/L
                    </div>
                    <div className="text-[10px] text-amber-400">
                      {currentVitals.lactate > 2.0 ? "↑ Anaerobic Glycolysis" : "Normal"}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-950/80 p-3">
                    <div className="text-[10px] text-slate-400">Interleukin-6 (IL-6)</div>
                    <div className="mt-1 font-mono text-lg font-bold text-slate-100">
                      {currentVitals.il6} pg/mL
                    </div>
                    <div className="text-[10px] text-red-400">
                      {currentVitals.il6 > 7 ? "↑ Cytokine Cascade" : "Normal"}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-950/80 p-3">
                    <div className="text-[10px] text-slate-400">HLA-DR (Immune State)</div>
                    <div className="mt-1 font-mono text-lg font-bold text-slate-100">
                      {currentVitals.hla_dr}%
                    </div>
                    <div className="text-[10px] text-yellow-400">
                      {currentVitals.hla_dr < 50 ? "↓ Immunoparalysis" : "Normal"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Intelligence & Clinical Care Bundle Column */}
            <div className="space-y-6">
              {/* Sepsis Risk Gauge Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    SepsiOmics AI Inference
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      prediction.severity === "Severe"
                        ? "bg-red-500/20 text-red-400"
                        : prediction.severity === "Moderate"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-emerald-500/20 text-emerald-400"
                    }`}
                  >
                    {prediction.severity} Acuity
                  </span>
                </div>

                <div className="mt-6 text-center">
                  <div
                    className={`font-mono text-6xl font-black ${
                      prediction.probability > 0.75
                        ? "text-red-400"
                        : prediction.probability > 0.45
                          ? "text-amber-400"
                          : "text-emerald-400"
                    }`}
                  >
                    {(prediction.probability * 100).toFixed(0)}%
                  </div>
                  <div className="mt-1 text-xs text-slate-400">Sepsis Probability Score</div>

                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full transition-all duration-500 ${
                        prediction.probability > 0.75
                          ? "bg-red-500"
                          : prediction.probability > 0.45
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(100, prediction.probability * 100)}%` }}
                    />
                  </div>
                </div>

                {decompMinutes && (
                  <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300">
                    <Clock className="h-4 w-4 text-amber-400" />
                    <span>
                      Estimated Decompensation: <strong>~{decompMinutes} minutes</strong>
                    </span>
                  </div>
                )}

                {/* Top Contributing Biomarkers */}
                <div className="mt-6">
                  <div className="text-xs font-semibold text-slate-300">
                    Top Contributing Risk Drivers:
                  </div>
                  <ul className="mt-2 space-y-1.5 text-xs">
                    {prediction.topDrivers.slice(0, 3).map((d) => (
                      <li
                        key={d.key}
                        className="flex items-center justify-between rounded-lg bg-slate-950/60 px-3 py-1.5"
                      >
                        <span className="text-slate-300">{d.label}</span>
                        <span className="font-mono font-semibold text-red-400">
                          {d.value.toFixed(1)} [{d.status}]
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Surviving Sepsis Campaign 1-Hour Protocol Checklist */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Surviving Sepsis 1-Hour Bundle
                  </h3>
                  <span className="text-[10px] text-slate-500">Clinical Protocol</span>
                </div>

                <div className="mt-4 space-y-2.5 text-xs">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.lactateMeasured}
                      onChange={(e) =>
                        setChecklist({ ...checklist, lactateMeasured: e.target.checked })
                      }
                      className="rounded border-slate-700 bg-slate-950 text-primary focus:ring-0"
                    />
                    <span className={checklist.lactateMeasured ? "line-through text-slate-500" : "text-slate-300"}>
                      1. Measure initial blood lactate level
                    </span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.bloodCulturesDrawn}
                      onChange={(e) =>
                        setChecklist({ ...checklist, bloodCulturesDrawn: e.target.checked })
                      }
                      className="rounded border-slate-700 bg-slate-950 text-primary focus:ring-0"
                    />
                    <span className={checklist.bloodCulturesDrawn ? "line-through text-slate-500" : "text-slate-300"}>
                      2. Blood cultures prior to antimicrobial therapy
                    </span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.antibioticsGiven}
                      onChange={(e) =>
                        setChecklist({ ...checklist, antibioticsGiven: e.target.checked })
                      }
                      className="rounded border-slate-700 bg-slate-950 text-primary focus:ring-0"
                    />
                    <span className={checklist.antibioticsGiven ? "line-through text-slate-500" : "text-slate-300"}>
                      3. Administer broad-spectrum IV antimicrobials
                    </span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.fluidsStarted}
                      onChange={(e) =>
                        setChecklist({ ...checklist, fluidsStarted: e.target.checked })
                      }
                      className="rounded border-slate-700 bg-slate-950 text-primary focus:ring-0"
                    />
                    <span className={checklist.fluidsStarted ? "line-through text-slate-500" : "text-slate-300"}>
                      4. 30 mL/kg IV crystalloid fluid for MAP &lt; 65
                    </span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.vasopressorReady}
                      onChange={(e) =>
                        setChecklist({ ...checklist, vasopressorReady: e.target.checked })
                      }
                      className="rounded border-slate-700 bg-slate-950 text-primary focus:ring-0"
                    />
                    <span className={checklist.vasopressorReady ? "line-through text-slate-500" : "text-slate-300"}>
                      5. Norepinephrine infusion if refractory
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
