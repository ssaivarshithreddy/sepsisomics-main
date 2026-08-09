const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";
const SESSION_KEY = "sepsiomics:session";
export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function setSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
export async function apiRequest(path, init = {}) {
  const session = getSession();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (response.status === 204) {
    return undefined;
  }
  // Handle 202 Accepted (typically for email confirmation required)
  if (response.status === 202) {
    const body = await response.json().catch(() => null);
    const message = body?.detail ?? "Email confirmation required. Please check your email.";
    throw new Error(message);
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body?.error?.message ?? body?.detail ?? "Request failed";
    throw new Error(message);
  }
  return body.data;
}
export async function login(email, password) {
  const session = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setSession(session);
  return session;
}
export async function signup(email, password) {
  const session = await apiRequest("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setSession(session);
  return session;
}
export function logout() {
  clearSession();
}
