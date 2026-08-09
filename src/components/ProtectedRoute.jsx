import { Navigate } from "@tanstack/react-router";
import { getSession } from "@/lib/api";
export function ProtectedRoute({ children }) {
  if (!getSession()) {
    return <Navigate to="/login" search={{ redirect: window.location.pathname }} />;
  }
  return children;
}
