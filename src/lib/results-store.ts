import { apiRequest, type Page } from "@/lib/api";
import type { OmicsRecord, PredictionResult } from "./sepsis-model";

export interface StoredPrediction {
  id: string;
  patientId: string;
  createdAt: string;
  record: OmicsRecord;
  result: PredictionResult;
}

interface ApiPrediction {
  id: string;
  patient_id: string | null;
  patient_identifier: string;
  created_at: string;
  record: OmicsRecord;
  result: PredictionResult;
}

function fromApi(prediction: ApiPrediction): StoredPrediction {
  return {
    id: prediction.id,
    patientId: prediction.patient_identifier || prediction.patient_id || "Patient",
    createdAt: prediction.created_at,
    record: prediction.record,
    result: prediction.result,
  };
}

export async function getPredictions(): Promise<StoredPrediction[]> {
  const page = await apiRequest<Page<ApiPrediction>>("/predictions?limit=100");
  return page.data.map(fromApi);
}

export async function savePredictions(records: OmicsRecord[]): Promise<StoredPrediction[]> {
  const predictions = await apiRequest<ApiPrediction[]>("/predictions/batch", {
    method: "POST",
    body: JSON.stringify({ records }),
  });
  return predictions.map(fromApi);
}

export async function clearPredictions(): Promise<void> {
  await apiRequest<void>("/predictions", { method: "DELETE" });
}
