import { createFileRoute, useNavigate, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { safePostAuthPath } from "@/lib/safePostAuthPath";
import { z } from "zod";

export const Route = createFileRoute("/auth")({
  validateSearch: (raw: unknown) => {
    const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const next = o.next;
    if (typeof next === "string" && next.startsWith("/") && !next.startsWith("//") && next !== "/auth") {
      return { next };
    }
    return {};
  },
  head: () => ({
    meta: [
      { title: "Login or Sign up — EARNGEN-AI" },
      { name: "description", content: "Sign in to track your verified earnings or create a free EARNGEN-AI account." },
    ],
  }),
  component: AuthPage,
});

const signInSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "At least 6 characters"),
});

const signUpSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters").max(72, "Too long"),
  name: z.string().trim().min(1, "Name required").max(80),
  college: z.string().trim().max(120).optional().default(""),
  city: z.string().trim().max(80).optional().default(""),
});

function AuthPage() {
  const { signIn, signUp, user, resendSignupConfirmation } = useAuth();
  const navigate = useNavigate();
  const { next } = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [form, setForm] = useState({ email: "", password: "", name: "", college: "", city: "" });
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  const destination = safePostAuthPath(next);

  useEffect(() => {
    if (user) navigate({ to: destination });
  }, [user, navigate, destination]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        const parsed = signInSchema.safeParse(form);
        if (!parsed.success) { setErr(parsed.error.issues[0].message); return; }
        setNeedsEmailConfirmation(false);
        const { error, code } = await signIn(parsed.data.email, parsed.data.password);
        if (error) {
          const unconfirmed =
            code === "email_not_confirmed" ||
            error.toLowerCase().includes("email not confirmed");
          setNeedsEmailConfirmation(unconfirmed);
          setErr(
            unconfirmed
              ? "This account was created while email confirmation was required. It stays unconfirmed until you use the link in your email, or an admin confirms it in Supabase."
              : error,
          );
        } else navigate({ to: destination });
      } else {
        const parsed = signUpSchema.safeParse(form);
        if (!parsed.success) { setErr(parsed.error.issues[0].message); return; }
        const { error } = await signUp(parsed.data.email, parsed.data.password, {
          full_name: parsed.data.name, college: parsed.data.college, city: parsed.data.city,
        });
        if (error) setErr(error);
        else { setMsg("Account created! Redirecting…"); navigate({ to: destination }); }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground grid place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="font-semibold text-2xl tracking-tight text-brand inline-flex items-center gap-2">
            <img src="/logo-cropped.png" alt="EARNGEN-AI logo" className="size-9 rounded-full object-cover ring-2 ring-brand/10 bg-white" />
            EARNGEN-AI<span className="text-foreground">.</span>
          </Link>
          <p className="text-sm text-muted-foreground mt-2">Your skills deserve a salary.</p>
        </div>

        <div className="rounded-2xl bg-card ring-1 ring-border p-6">
          <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg mb-6">
            <button type="button" onClick={() => { setMode("signin"); setErr(null); setMsg(null); setNeedsEmailConfirmation(false); }}
              className={"py-2 text-sm font-medium rounded-md transition " + (mode === "signin" ? "bg-background shadow-sm" : "text-muted-foreground")}>
              Sign in
            </button>
            <button type="button" onClick={() => { setMode("signup"); setErr(null); setMsg(null); setNeedsEmailConfirmation(false); }}
              className={"py-2 text-sm font-medium rounded-md transition " + (mode === "signup" ? "bg-background shadow-sm" : "text-muted-foreground")}>
              Sign up
            </button>
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <>
                <Field label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Priya Sharma" />
                <Field label="College" value={form.college} onChange={(v) => setForm({ ...form, college: v })} placeholder="IIIT Hyderabad" />
                <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} placeholder="Hyderabad" />
              </>
            )}
            <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="you@email.com" />
            <Field label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder="••••••••" />

            {err && <p className="text-sm text-red-500">{err}</p>}
            {needsEmailConfirmation && mode === "signin" && (
              <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground space-y-2">
                <p>
                  Turning off "Confirm email" in Supabase only applies to <span className="font-medium text-foreground">new</span> signups. Your user row may still have an unconfirmed email from before.
                </p>
                <p className="text-foreground/90">
                  Fix: Supabase Dashboard → Authentication → Users → select your user → confirm the email, or delete the user and sign up again.
                </p>
                <button
                  type="button"
                  disabled={busy || !form.email.trim()}
                  onClick={async () => {
                    setErr(null);
                    setMsg(null);
                    setBusy(true);
                    try {
                      const { error: rErr } = await resendSignupConfirmation(form.email.trim());
                      if (rErr) setErr(rErr);
                      else setMsg("If this project sends confirmation emails, check your inbox (and spam) for the link.");
                    } finally {
                      setBusy(false);
                    }
                  }}
                  className="text-xs font-medium text-brand underline-offset-2 hover:underline disabled:opacity-50"
                >
                  Resend confirmation email
                </button>
              </div>
            )}
            {msg && <p className="text-sm text-emerald-600">{msg}</p>}

            <button type="submit" disabled={busy}
              className="w-full mt-2 rounded-lg bg-foreground text-background py-2.5 text-sm font-semibold disabled:opacity-50">
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link to="/" className="hover:text-foreground">← Back to landing</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1 w-full rounded-lg ring-1 ring-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
    </label>
  );
}
