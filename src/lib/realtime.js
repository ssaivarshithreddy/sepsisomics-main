import { getSession } from "@/lib/api";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";
export function createVitalsSocket(patientId) {
  const session = getSession();
  if (!session?.access_token) return null;
  const url = new URL(API_BASE_URL.replace(/^http/, "ws") + "/realtime/vitals");
  url.searchParams.set("patient_id", patientId);
  url.searchParams.set("token", session.access_token);
  return new WebSocket(url);
}
