import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { BIOMARKERS } from "@/lib/sepsis-model";
import { Dna, FlaskConical, HeartPulse, Atom } from "lucide-react";
export const Route = createFileRoute("/biomarkers")({
  head: () => ({
    meta: [
      { title: "Biomarker Insights — SepsiOmics" },
      {
        name: "description",
        content: "Reference panel of multi-omics biomarkers used in the SepsiOmics model.",
      },
    ],
  }),
  component: BiomarkersPage,
});
const categoryMeta = {
  Clinical: { icon: HeartPulse, color: "var(--color-primary)" },
  Proteomics: { icon: FlaskConical, color: "var(--color-accent)" },
  Genomics: { icon: Dna, color: "var(--color-chart-3)" },
  Metabolomics: { icon: Atom, color: "var(--color-chart-4)" },
};
function BiomarkersPage() {
  const grouped = BIOMARKERS.reduce((acc, b) => {
    (acc[b.category] ??= []).push(b);
    return acc;
  }, {});
  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Biomarker Insights
          </h1>
          <p className="mt-3 text-muted-foreground">
            SepsiOmics integrates {BIOMARKERS.length} biomarkers across four omics layers. Each
            marker contributes a weighted, standardized signal to the final sepsis risk score.
          </p>
        </div>

        <div className="mt-10 space-y-10">
          {Object.entries(grouped).map(([cat, items]) => {
            const meta = categoryMeta[cat];
            const Icon = meta.icon;
            return (
              <section key={cat}>
                <div className="mb-4 flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{
                      background: `color-mix(in oklab, ${meta.color} 15%, transparent)`,
                      color: meta.color,
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-display text-xl font-semibold">{cat}</h2>
                    <p className="text-xs text-muted-foreground">{items.length} markers</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((b) => (
                    <div
                      key={b.key}
                      className="group rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-[var(--shadow-card)] hover:-translate-y-0.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-display text-base font-semibold">{b.label}</h3>
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            background:
                              b.weight >= 0
                                ? "color-mix(in oklab, var(--color-destructive) 12%, transparent)"
                                : "color-mix(in oklab, var(--color-success) 12%, transparent)",
                            color:
                              b.weight >= 0 ? "var(--color-destructive)" : "var(--color-success)",
                          }}
                        >
                          {b.weight >= 0 ? "↑ risk" : "↓ risk"}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {b.description}
                      </p>
                      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
                        <div>
                          <div className="text-muted-foreground">Normal</div>
                          <div className="font-mono font-semibold">
                            {b.normalRange[0]}–{b.normalRange[1]}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-muted-foreground">Weight</div>
                          <div className="font-mono font-semibold" style={{ color: meta.color }}>
                            {b.weight.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
