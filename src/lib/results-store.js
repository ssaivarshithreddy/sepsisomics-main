import { apiRequest } from "@/lib/api";
import { scoreRecord } from "@/lib/sepsis-model";

const LOCAL_STORAGE_KEY = "sepsiomics:offline_predictions";

function getLocalPredictions() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalPredictions(predictions) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(predictions));
  } catch {
    // ignore quota errors
  }
}

function fromApi(prediction) {
  return {
    id: prediction.id,
    patientId: prediction.patient_identifier || prediction.patient_id || "Patient",
    createdAt: prediction.created_at,
    record: prediction.record,
    result: prediction.result,
  };
}

export async function getPredictions() {
  try {
    const page = await apiRequest("/predictions?limit=100");
    if (page && Array.isArray(page.data) && page.data.length > 0) {
      return page.data.map(fromApi);
    }
  } catch (err) {
    console.warn("Backend unavailable, loading local offline predictions:", err);
  }
  return getLocalPredictions();
}

export async function savePredictions(records) {
  try {
    const predictions = await apiRequest("/predictions/batch", {
      method: "POST",
      body: JSON.stringify({ records }),
    });
    if (predictions && Array.isArray(predictions)) {
      const mapped = predictions.map(fromApi);
      setLocalPredictions(mapped);
      return mapped;
    }
  } catch (err) {
    console.warn("Backend unavailable, scoring cohort locally:", err);
  }

  // Resilient local multi-omics scoring fallback
  const fallback = records.map((record, idx) => {
    const patientId = record.patient_id || record.id || `Patient ${idx + 1}`;
    const result = scoreRecord(record);
    return {
      id: `local-${Date.now()}-${idx}`,
      patientId: String(patientId),
      createdAt: new Date().toISOString(),
      record,
      result,
    };
  });

  setLocalPredictions(fallback);
  return fallback;
}

export async function clearPredictions() {
  try {
    await apiRequest("/predictions", { method: "DELETE" });
  } catch {
    // ignore
  }
  localStorage.removeItem(LOCAL_STORAGE_KEY);
}

