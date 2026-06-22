import { Navigate } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { getSession } from "@/lib/api";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  if (!getSession()) {
    return <Navigate to="/login" search={{ redirect: window.location.pathname }} />;
  }
  return children;
}
