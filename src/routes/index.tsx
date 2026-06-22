import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Upload,
  BarChart3,
  Microscope,
  Shield,
  Zap,
  Brain,
  FlaskConical,
} from "lucide-react";
import { Header } from "@/components/Header";
import heroImage from "@/assets/hero-omics.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SepsiOmics — AI Multi-Omics Sepsis Prediction" },
      {
        name: "description",
        content:
          "Upload patient multi-omics data and receive an explainable AI prediction of sepsis risk and severity.",
      },
    ],
  }),
  component: HomePage,
});

const features = [
  {
    icon: Brain,
    title: "Multi-Omics AI",
    text: "Combines proteomics, genomics, metabolomics & clinical data into a single risk model.",
  },
  {
    icon: Zap,
    title: "Early Prediction",
    text: "Detects sepsis hours before classical SIRS criteria trigger an alarm.",
  },
  {
    icon: Shield,
    title: "Severity Classification",
    text: "Stratifies patients into Low, Moderate, and Severe risk for triage.",
  },
  {
    icon: FlaskConical,
    title: "Explainable",
    text: "Every prediction surfaces the top contributing biomarkers — no black box.",
  },
];

const steps = [
  { n: "01", title: "Upload data", text: "Drop a CSV or Excel file with patient omics + vitals." },
  {
    n: "02",
    title: "AI analysis",
    text: "The pipeline normalizes, scores, and classifies each patient instantly.",
  },
  {
    n: "03",
    title: "Insights",
    text: "Review per-patient risk, severity, and top biomarker drivers.",
  },
];

function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[image:var(--gradient-soft)]" />
        <div className="absolute -top-32 -right-32 -z-10 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 -z-10 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-24 lg:px-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Activity className="h-3.5 w-3.5" />
              AI · Bioinformatics · Clinical Decision Support
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Early sepsis prediction from{" "}
              <span className="bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
                multi-omics
              </span>{" "}
              data.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              SepsiOmics combines proteomics, genomics, metabolomics, and clinical vitals to predict
              sepsis onset and severity — with explainable AI that highlights the biomarkers behind
              every decision.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] transition-all hover:opacity-90 hover:translate-y-[-1px]"
              >
                <Upload className="h-4 w-4" /> Upload Patient Data
              </Link>
              <Link
                to="/biomarkers"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <Microscope className="h-4 w-4" /> Explore Biomarkers
              </Link>
            </div>

            <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-border pt-6">
              {[
                ["14", "Biomarkers"],
                ["4", "Omics layers"],
                ["<1s", "Inference"],
              ].map(([v, k]) => (
                <div key={k}>
                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {k}
                  </dt>
                  <dd className="mt-1 font-display text-2xl font-bold text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-elegant)]">
              <img
                src={heroImage}
                alt="Glowing DNA helix with proteomic and ECG signals representing multi-omics analysis"
                width={1536}
                height={1024}
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-md">
                <div className="flex items-center justify-between text-xs text-white/80">
                  <span className="font-medium">Patient P-003</span>
                  <span className="rounded-full bg-destructive/90 px-2 py-0.5 font-semibold text-white">
                    Severe risk · 92%
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[92%] bg-gradient-to-r from-warning to-destructive" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/60 bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              A clinical-grade research tool
            </h2>
            <p className="mt-3 text-muted-foreground">
              Built for bioinformatics research and clinical decision support.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-[var(--shadow-card)] hover:-translate-y-0.5"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="relative">
              <span className="font-display text-5xl font-bold text-primary/15">{s.n}</span>
              <h3 className="mt-2 font-display text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-[image:var(--gradient-primary)] p-10 text-primary-foreground shadow-[var(--shadow-elegant)] sm:p-14">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to analyze a cohort?
              </h2>
              <p className="mt-3 max-w-xl text-primary-foreground/90">
                Upload your dataset to see SepsiOmics in action.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-primary shadow-lg hover:bg-white/95"
              >
                <Upload className="h-4 w-4" /> Upload data
              </Link>
              <Link
                to="/results"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
              >
                <BarChart3 className="h-4 w-4" /> View results
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center text-xs text-muted-foreground sm:px-6 lg:px-8">
          SepsiOmics · Clinical decision support foundation · Not for clinical use.
        </div>
      </footer>
    </div>
  );
}
