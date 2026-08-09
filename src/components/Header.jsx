import { Link, useRouterState } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { clearSession, getSession } from "@/lib/api";
const links = [
  { to: "/", label: "Home" },
  { to: "/upload", label: "Upload" },
  { to: "/results", label: "Results" },
  { to: "/biomarkers", label: "Biomarkers" },
];
export function Header() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const session = getSession();
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-elegant)] transition-transform group-hover:scale-105">
            <Activity className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            Sepsi<span className="text-primary">Omics</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        {session ? (
          <button
            onClick={() => {
              clearSession();
              window.location.href = "/login";
            }}
            className="hidden rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 sm:inline-flex"
          >
            Sign Out
          </button>
        ) : (
          <Link
            to="/login"
            className="hidden rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 sm:inline-flex"
          >
            Login
          </Link>
        )}
      </div>

      {/* Mobile nav */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-border/60 px-3 py-2 md:hidden">
        {links.map((l) => {
          const active = pathname === l.to;
          return (
            <Link
              key={l.to}
              to={l.to}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
