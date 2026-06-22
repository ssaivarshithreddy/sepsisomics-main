import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import Papa from "papaparse";
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2 } from "lucide-react";
import { Header } from "@/components/Header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { savePredictions } from "@/lib/results-store";
import { BIOMARKERS, type OmicsRecord } from "@/lib/sepsis-model";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload Patient Data — SepsiOmics" },
      {
        name: "description",
        content: "Upload a CSV of multi-omics patient data for sepsis risk prediction.",
      },
    ],
  }),
  component: UploadPage,
});

function buildSampleCsv(): string {
  const headers = ["patient_id", ...BIOMARKERS.map((b) => b.key)];
  return [headers.join(",")].join("\n");
}

function UploadPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [filename, setFilename] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processRecords = async (records: OmicsRecord[]) => {
    if (records.length === 0) {
      setError("No rows found in file.");
      return;
    }
    try {
      await savePredictions(records);
      navigate({ to: "/results" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to process records.");
    } finally {
      setParsing(false);
    }
  };

  const handleFile = (file: File) => {
    setFilename(file.name);
    setError(null);
    setParsing(true);
    Papa.parse<OmicsRecord>(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (res) => {
        if (res.errors.length) {
          setParsing(false);
          setError(res.errors[0].message);
          return;
        }
        void processRecords(res.data as OmicsRecord[]);
      },
      error: (err) => {
        setParsing(false);
        setError(err.message);
      },
    });
  };

  const downloadSample = () => {
    const blob = new Blob([buildSampleCsv()], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sepsiomics-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Header />

        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Upload Patient Data
            </h1>
            <p className="mt-2 text-muted-foreground">
              CSV file with one patient per row. Columns should match the expected biomarker keys.
            </p>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            className={`relative rounded-3xl border-2 border-dashed bg-card p-10 text-center transition-all sm:p-16 ${
              dragOver ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Upload className="h-7 w-7" />
            </span>
            <h2 className="mt-4 font-display text-xl font-semibold">Drag & drop your CSV file</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              or click to browse from your device
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <FileSpreadsheet className="h-4 w-4" /> Choose file
              </button>
              <button
                onClick={downloadSample}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
              >
                <Download className="h-4 w-4" /> Download template
              </button>
            </div>

            {filename && !error && (
              <p className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" /> {filename}{" "}
                {parsing && "· processing…"}
              </p>
            )}
            {error && (
              <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5" /> {error}
              </p>
            )}
          </div>

          {/* Schema reference */}
          <div className="mt-10 rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display text-lg font-semibold">Expected columns</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Missing columns are tolerated; the model will still score available features.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {BIOMARKERS.map((b) => (
                <div
                  key={b.key}
                  className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-xs"
                >
                  <code className="font-mono text-foreground">{b.key}</code>
                  <span className="text-muted-foreground">{b.label}</span>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-xs">
                <code className="font-mono text-foreground">patient_id</code>
                <span className="text-muted-foreground">Optional identifier</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
