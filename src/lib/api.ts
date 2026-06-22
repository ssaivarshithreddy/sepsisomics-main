export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface Page<T> {
  data: T[];
  limit: number;
  offset: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";
const SESSION_KEY = "sepsiomics:session";

export interface AuthUser {
  id: string;
  email: string | null;
  role: "doctor" | "admin";
}

export interface AuthSession {
  access_token: string;
  refresh_token?: string | null;
  token_type: "bearer";
  user: AuthUser;
}

export function getSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function setSession(session: AuthSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = getSession();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (response.status === 204) {
    return undefined as T;
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

  return (body as ApiResponse<T>).data;
}

export async function login(email: string, password: string): Promise<AuthSession> {
  const session = await apiRequest<AuthSession>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setSession(session);
  return session;
}

export async function signup(email: string, password: string): Promise<AuthSession> {
  const session = await apiRequest<AuthSession>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setSession(session);
  return session;
}

export function logout(): void {
  clearSession();
}
