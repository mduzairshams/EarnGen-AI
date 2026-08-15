import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { ReactNode, useState, useEffect } from "react";
import { Menu, X, Bot, LogOut, MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/auth";
import logoUrl from "@/assets/logo-cropped.png";

const NAV_AUTH = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/opportunities", label: "Opportunities" },
  { to: "/assessment", label: "Assessment" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/upskill", label: "Upskill" },
  { to: "/sprint", label: "7-Day Sprint" },
  { to: "/proof", label: "Proof-of-Work" },
] as const;

export function Shell({ children }: { children?: ReactNode }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [open, setOpen] = useState(false);
  const { user, profile, avatarUrl, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const [showBubble, setShowBubble] = useState(false);

  useEffect(() => {
    if (!user) {
      setShowBubble(false);
      return;
    }
    // Initial delay before first pop
    const initialTimer = setTimeout(() => {
      setShowBubble(true);
    }, 3000);

    // Toggle every 5 seconds to pop in and out dynamically!
    const interval = setInterval(() => {
      setShowBubble((prev) => !prev);
    }, 5000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [user]);

  const initial = (profile?.full_name || user?.email || "?").charAt(0).toUpperCase();
  const homeHref = user ? "/dashboard" : "/";

  async function handleSignOut() {
    await signOut();
    setOpen(false);
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!loading && !user && (
        <div className="bg-brand/10 text-brand text-xs text-center py-2 px-4 font-medium">
          Sign in to use AI (roadmap, sprint, and chat).{" "}
          <Link to="/auth" className="underline font-semibold">
            Sign in or create an account
          </Link>
        </div>
      )}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to={homeHref} className="font-semibold tracking-tight text-lg text-brand inline-flex items-center gap-2 select-none hover:opacity-90 transition-opacity shrink-0">
              <img src={logoUrl} alt="EARNGEN-AI logo" className="size-10 rounded-full object-cover ring-2 ring-brand/10 bg-white" />
              <span>
                EARNGEN<span className="text-foreground">-AI</span>
              </span>
            </Link>
            {user ? (
              <div className="hidden lg:flex items-center gap-2">
                {NAV_AUTH.map((n) => {
                  const active = path === n.to || path.startsWith(n.to);
                  return (
                    <Link
                      key={n.to}
                      to={n.to}
                      className={
                        "text-[10px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-xl transition-all duration-200 select-none " +
                        (active
                          ? "bg-brand/10 text-brand shadow-sm"
                          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground")
                      }
                    >
                      {n.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/profile" className="hidden sm:flex items-center gap-2 hover:opacity-85 transition-opacity">
                  <div className="size-8 rounded-full bg-gradient-to-br from-brand to-brand-light overflow-hidden grid place-items-center text-xs text-white font-bold shrink-0 ring-1 ring-border">
                    {avatarUrl
                      ? <img src={avatarUrl} alt="avatar" className="size-full object-cover" />
                      : initial}
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground hidden lg:inline truncate max-w-[120px]">
                    {profile?.full_name || user.email}
                  </span>
                </Link>
                {/* Real-time Chat Workspace Icon */}
                <Link
                  to="/chats"
                  className={`inline-flex size-8 items-center justify-center rounded-xl transition-all border border-border/40 relative shrink-0 ${
                    path === "/chats"
                      ? "bg-brand/10 text-brand border-brand/20 shadow-sm"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                  title="Messages & P2P Chats"
                >
                  <MessageSquare className="size-4" />
                  <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-brand animate-pulse" />
                </Link>
                <button
                  onClick={handleSignOut}
                  className="hidden lg:inline-flex size-8 items-center justify-center rounded-xl bg-muted/40 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors group shrink-0 border border-border/40"
                  title="Sign out"
                >
                  <LogOut className="size-4 group-hover:-translate-x-0.5 transition-transform" />
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="hidden lg:inline-flex rounded-lg bg-foreground text-background px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Sign in
              </Link>
            )}
            <button
              type="button"
              aria-label="Toggle menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="lg:hidden inline-flex size-9 items-center justify-center rounded-lg ring-1 ring-border text-foreground hover:bg-muted/40 transition-colors shrink-0"
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>
        {open ? (
          <div className="lg:hidden border-t border-border bg-background">
            <div className="px-4 py-3 flex flex-col gap-1">
              {user
                ? [
                    ...NAV_AUTH.map((n) => ({ to: n.to, label: n.label })),
                    { to: "/chats", label: "💬 Messages & Chats" },
                  ].map((n) => {
                    const active = path === n.to || path.startsWith(n.to);
                    return (
                      <Link
                        key={n.to}
                        to={n.to}
                        onClick={() => setOpen(false)}
                        className={
                          "px-3 py-2 rounded-lg text-sm font-medium " +
                          (active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")
                        }
                      >
                        {n.label}
                      </Link>
                    );
                  })
                : null}
              <div className="border-t border-border my-2" />
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-left text-muted-foreground hover:bg-muted"
                >
                  Sign out ({profile?.full_name || user.email})
                </button>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-semibold bg-foreground text-background text-center"
                >
                  Sign in / Sign up
                </Link>
              )}
            </div>
          </div>
        ) : null}
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">{children ?? <Outlet />}</main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12 mt-8 sm:mt-12 border-t border-border">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div className="max-w-[42ch]">
            <p className="text-sm font-semibold mb-2 inline-flex items-center gap-2">
              <img src={logoUrl} alt="" width={24} height={24} className="size-6" loading="lazy" />
              EARNGEN-AI
            </p>
            <p className="text-sm text-muted-foreground text-pretty">
              The income operating system for student earners. Verified skills. Verified results.
            </p>
          </div>
          <div className="flex gap-12 text-sm">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</p>
              {user ? (
                <>
                  <Link to="/speak-with-ai" className="block text-muted-foreground hover:text-foreground">
                    Speak with AI
                  </Link>
                  <Link to="/opportunities" className="block text-muted-foreground hover:text-foreground">
                    Opportunities
                  </Link>
                  <Link to="/sprint" className="block text-muted-foreground hover:text-foreground">
                    7-Day Sprint
                  </Link>
                  <Link to="/proof" className="block text-muted-foreground hover:text-foreground">
                    Proof-of-Work
                  </Link>
                </>
              ) : (
                <Link to="/auth" className="block text-muted-foreground hover:text-foreground">
                  Sign in to explore
                </Link>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account</p>
              {user ? (
                <button onClick={handleSignOut} className="block text-muted-foreground hover:text-foreground">
                  Sign out
                </button>
              ) : (
                <Link to="/auth" className="block text-muted-foreground hover:text-foreground">
                  Sign in / Sign up
                </Link>
              )}
            </div>
          </div>
        </div>
      </footer>

      {user && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center">
          {/* Attention Popover Thought Bubble */}
          <div
            className={`absolute right-16 bottom-2 bg-foreground text-background text-xs font-bold px-3 py-2 rounded-xl whitespace-nowrap shadow-xl border border-border flex items-center gap-1.5 z-40 select-none transition-all duration-300 transform origin-right ${
              showBubble ? "scale-100 opacity-100 translate-x-0" : "scale-75 opacity-0 translate-x-4 pointer-events-none"
            }`}
          >
            <span>Need AI help? 🤖</span>
            {/* Thought speech bubble pointer arrow */}
            <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-foreground" />
          </div>

          {/* Floating Action Button */}
          <Link
            to="/speak-with-ai"
            className="size-14 rounded-full bg-brand text-brand-foreground shadow-lg hover:shadow-brand/20 hover:scale-110 active:scale-95 transition-all flex items-center justify-center group relative z-50"
            title="Speak with AI"
            onClick={() => setShowBubble(false)}
          >
            <img 
              src={logoUrl} 
              alt="AI Bot" 
              className="size-7 rounded-full object-cover group-hover:rotate-12 transition-transform duration-300 filter saturate-150 brightness-110"
              loading="lazy"
            />
            <span className="absolute right-16 scale-0 group-hover:scale-100 bg-foreground text-background text-[11px] font-bold px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all shadow-md duration-200">
              Speak with AI Chatbot 🤖
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}

export function Card({ children, className = "", style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div style={style} className={"rounded-2xl bg-card ring-1 ring-border " + className}>{children}</div>;
}

export function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div
      className={
        "p-4 sm:p-6 rounded-2xl ring-1 transition-all duration-300 " +
        (accent
          ? "bg-brand text-brand-foreground ring-brand shadow-lg shadow-brand/10 hover:shadow-brand/20"
          : "bg-card ring-border")
      }
    >
      <p className={"text-[10px] font-bold uppercase tracking-wider mb-2 " + (accent ? "text-brand-foreground/85" : "text-muted-foreground")}>{label}</p>
      <p className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{value}</p>
      {sub ? <p className={"text-xs font-medium mt-2 " + (accent ? "text-brand-foreground/90" : "text-brand")}>{sub}</p> : null}
    </div>
  );
}
