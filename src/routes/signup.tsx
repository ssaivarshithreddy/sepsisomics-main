import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AlertCircle, UserPlus, CheckCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { signup } from "@/lib/api";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign Up — SepsiOmics" },
      { name: "description", content: "Create a new account to access SepsiOmics clinical workflows." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      await signup(email, password);
      // If signup succeeds, navigate to upload
      navigate({ to: "/upload" });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unable to sign up. Please try again.";
      
      // Check if it's an email confirmation message (not an actual error)
      if (errorMessage.toLowerCase().includes("email") && errorMessage.toLowerCase().includes("confirm")) {
        setSuccess(errorMessage);
        setError(null);
      } else {
        setError(errorMessage);
        setSuccess(null);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">Create Account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign up for SepsiOmics to access clinical workflows.
        </p>

        <form
          onSubmit={submit}
          className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
        >
          <label className="block text-sm font-medium">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              required
              disabled={loading}
            />
          </label>
          <label className="mt-4 block text-sm font-medium">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              required
              disabled={loading}
            />
          </label>
          <label className="mt-4 block text-sm font-medium">
            Confirm Password
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-2 flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              required
              disabled={loading}
            />
          </label>
          {error && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" /> {error}
            </p>
          )}
          {success && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700">
              <CheckCircle className="h-3.5 w-3.5" /> {success}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" /> {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <button
            onClick={() => navigate({ to: "/login" })}
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
