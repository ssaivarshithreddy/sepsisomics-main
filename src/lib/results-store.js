import { apiRequest } from "@/lib/api";
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
  const page = await apiRequest("/predictions?limit=100");
  return page.data.map(fromApi);
}
export async function savePredictions(records) {
  const predictions = await apiRequest("/predictions/batch", {
    method: "POST",
    body: JSON.stringify({ records }),
  });
  return predictions.map(fromApi);
}
export async function clearPredictions() {
  await apiRequest("/predictions", { method: "DELETE" });
}
